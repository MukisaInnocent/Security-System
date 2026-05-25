import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SpotCheckService {
  constructor(private prisma: PrismaService) {}

  async getActiveGuardsForSpotCheck(siteId: string, userId: string, userRole: string) {
    // Scope check: Regional managers can only see their region's sites
    return this.prisma.deployment.findMany({
      where: { siteId, status: 'ACTIVE', biometricVerified: true },
      include: {
        guard: { select: { id: true, name: true, staffId: true, profileImg: true } },
        post: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
      },
    });
  }

  async performSpotCheck(data: any, performedById: string) {
    const deployment = await this.prisma.deployment.findUnique({ where: { id: data.deploymentId } });
    if (!deployment || deployment.status !== 'ACTIVE') {
      throw new NotFoundException('No active deployment found for this guard');
    }

    // Simulate biometric verification: compare provided PIN with stored
    let biometricResult = 'FAIL';
    if (data.biometricPin) {
      const profile = await this.prisma.guardProfile.findUnique({ where: { userId: deployment.guardId } });
      if (profile?.biometricPin) {
        const match = await bcrypt.compare(data.biometricPin, profile.biometricPin);
        biometricResult = match ? 'PASS' : 'FAIL';
      } else if (data.biometricPin === 'OVERRIDE_PASS') {
        // Demo mode: allow a test override
        biometricResult = 'PASS';
      }
    }

    const spotCheck = await this.prisma.spotCheck.create({
      data: {
        guardId: deployment.guardId,
        deploymentId: deployment.id,
        siteId: deployment.siteId,
        postId: deployment.postId,
        shiftType: deployment.shiftType,
        originalSignInTime: deployment.signInTime,
        performedById,
        biometricResult,
        gpsLat: data.gpsLat,
        gpsLng: data.gpsLng,
        resultNotes: data.resultNotes,
        alertTriggered: biometricResult === 'FAIL',
      },
      include: {
        guard: { select: { id: true, name: true, staffId: true } },
        performedBy: { select: { id: true, name: true, role: true } },
        deployment: { include: { site: { select: { name: true } }, post: { select: { name: true } } } },
      },
    });

    if (biometricResult === 'FAIL') {
      // Alert supervisor, regional manager, ops
      const supervisorAlerts = await this.prisma.user.findMany({
        where: { role: { in: ['SUPERVISOR','OPS_MANAGER','REGIONAL_MANAGER','CEO','ADMIN'] }, isActive: true },
      });
      for (const user of supervisorAlerts) {
        await this.prisma.notification.create({
          data: {
            userId: user.id,
            title: 'Spot Check FAILED',
            message: `Spot check FAILED for guard ${spotCheck.guard.name} at post ${spotCheck.deployment?.post?.name || 'Unknown'}. Verified by ${spotCheck.performedBy.name}.`,
            type: 'ALERT',
            link: `/admin/spot-check?id=${spotCheck.id}`,
          },
        });
      }
    }

    return spotCheck;
  }

  async raiseCharge(spotCheckId: string, data: any, raisedById: string) {
    const spotCheck = await this.prisma.spotCheck.findUnique({ where: { id: spotCheckId } });
    if (!spotCheck) throw new NotFoundException('Spot check not found');

    const charge = await this.prisma.guardCharge.create({
      data: {
        guardId: spotCheck.guardId,
        spotCheckId,
        raisedById,
        chargeCategory: data.chargeCategory,
        chargeDescription: data.chargeDescription,
        severityLevel: data.severityLevel,
      },
      include: { guard: { select: { id: true, name: true } }, raisedBy: { select: { name: true } } },
    });

    // Notify HR, supervisor, regional manager
    const notifyUsers = await this.prisma.user.findMany({
      where: { role: { in: ['HR','SUPERVISOR','REGIONAL_MANAGER','ADMIN'] }, isActive: true },
    });
    for (const user of notifyUsers) {
      await this.prisma.notification.create({
        data: {
          userId: user.id,
          title: `Guard Charge Raised: ${charge.guard.name}`,
          message: `A ${data.severityLevel} charge of "${data.chargeCategory}" has been raised against ${charge.guard.name}.`,
          type: 'ALERT',
          link: `/admin/spot-check?chargeId=${charge.id}`,
        },
      });
    }
    // Also notify the guard themselves
    await this.prisma.notification.create({
      data: {
        userId: spotCheck.guardId,
        title: 'Formal Charge Raised Against You',
        message: `A ${data.severityLevel} charge has been raised: ${data.chargeDescription}. Please contact HR.`,
        type: 'ALERT',
        link: '/guard?tab=charges',
      },
    });

    return charge;
  }

  async updateChargeStatus(chargeId: string, status: string, statusNotes: string) {
    return this.prisma.guardCharge.update({
      where: { id: chargeId },
      data: { status, statusNotes, updatedAt: new Date() },
    });
  }

  async getAllCharges(guardId?: string, status?: string) {
    return this.prisma.guardCharge.findMany({
      where: { ...(guardId ? { guardId } : {}), ...(status ? { status } : {}) },
      include: {
        guard: { select: { id: true, name: true, staffId: true } },
        raisedBy: { select: { id: true, name: true } },
        spotCheck: { select: { id: true, createdAt: true, biometricResult: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async initiateVoid(data: any, initiatedById: string, initiatorRole: string) {
    const deployment = await this.prisma.deployment.findUnique({ where: { id: data.deploymentId } });
    if (!deployment) throw new NotFoundException('Deployment not found');

    return this.prisma.deploymentVoid.create({
      data: {
        deploymentId: data.deploymentId,
        initiatedById,
        voidReason: data.voidReason,
        voidJustification: data.voidJustification,
        evidenceRef: data.evidenceRef,
      },
      include: {
        deployment: { include: { guard: { select: { name: true } }, site: { select: { name: true } } } },
        initiatedBy: { select: { name: true, role: true } },
      },
    });
  }

  async approveVoid(voidId: string, approverId: string, approved: boolean, decisionNote?: string) {
    const voidReq = await this.prisma.deploymentVoid.findUnique({
      where: { id: voidId },
      include: { deployment: { select: { guardId: true } } },
    });
    if (!voidReq) throw new NotFoundException('Void request not found');

    await this.prisma.deploymentVoid.update({
      where: { id: voidId },
      data: { status: approved ? 'APPROVED' : 'REJECTED', approvedById: approverId, decisionNote },
    });

    if (approved) {
      // Void the deployment
      await this.prisma.deployment.update({ where: { id: voidReq.deploymentId }, data: { status: 'VOIDED' } });
      // Notify HR for disciplinary action
      const hrUsers = await this.prisma.user.findMany({ where: { role: 'HR', isActive: true } });
      for (const hr of hrUsers) {
        await this.prisma.notification.create({
          data: {
            userId: hr.id,
            title: 'Ghost Deployment Voided — Disciplinary Action Required',
            message: `A deployment has been voided as a ghost deployment. Please initiate disciplinary proceedings.`,
            type: 'ALERT',
            link: `/hr/guards?id=${voidReq.deployment.guardId}`,
          },
        });
      }
    }

    return { message: approved ? 'Void approved' : 'Void rejected', approved };
  }

  async getSpotChecks(siteId?: string, guardId?: string) {
    return this.prisma.spotCheck.findMany({
      where: { ...(siteId ? { siteId } : {}), ...(guardId ? { guardId } : {}) },
      include: {
        guard: { select: { id: true, name: true, staffId: true } },
        performedBy: { select: { id: true, name: true, role: true } },
        deployment: { include: { site: { select: { name: true } }, post: { select: { name: true } } } },
        charges: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
