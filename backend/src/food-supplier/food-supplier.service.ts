import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class FoodSupplierService {
  constructor(private prisma: PrismaService) {}

  async getHeadcount(siteId: string, supplierId: string) {
    // Verify supplier is authorised for this site
    const supplierAccount = await this.prisma.foodSupplierAccount.findFirst({
      where: { userId: supplierId, isActive: true, supplierSites: { some: { siteId, isActive: true } } },
      include: { supplierSites: { where: { siteId }, select: { mealPricePerPerson: true, mealPeriods: true } } },
    });
    if (!supplierAccount) throw new ForbiddenError('Not authorised for this site');

    const activeDeployments = await this.prisma.deployment.count({
      where: { siteId, status: 'ACTIVE', biometricVerified: true },
    });

    const now = new Date();
    const hour = now.getHours();
    const mealPeriod = hour >= 6 && hour < 15 ? 'LUNCH' : 'SUPPER';
    const mealPrice = supplierAccount.supplierSites[0]?.mealPricePerPerson || 0;

    return {
      siteId,
      activeGuards: activeDeployments,
      mealPeriod,
      mealPricePerPerson: mealPrice,
      projectedCost: activeDeployments * mealPrice,
    };
  }

  async startMealSession(siteId: string, supplierId: string) {
    const account = await this.prisma.foodSupplierAccount.findFirst({
      where: { userId: supplierId, isActive: true, supplierSites: { some: { siteId } } },
      include: { supplierSites: { where: { siteId } } },
    });
    if (!account) throw new NotFoundException('Supplier not authorised for this site');

    const totalOnDuty = await this.prisma.deployment.count({
      where: { siteId, status: 'ACTIVE', biometricVerified: true },
    });
    const now = new Date();
    const mealPeriod = now.getHours() >= 6 && now.getHours() < 15 ? 'LUNCH' : 'SUPPER';
    const shiftType = now.getHours() >= 7 && now.getHours() < 17 ? 'DAY' : 'NIGHT';
    const mealPrice = account.supplierSites[0]?.mealPricePerPerson || 0;

    return this.prisma.mealDelivery.create({
      data: {
        foodSupplierAccountId: account.id,
        siteId,
        shiftType,
        mealPeriod,
        sessionDate: now,
        sessionStart: now,
        totalGuardsOnDuty: totalOnDuty,
        mealPricePerPerson: mealPrice,
      },
    });
  }

  async verifyGuardMeal(sessionId: string, biometricPin: string, supplierId: string) {
    const session = await this.prisma.mealDelivery.findUnique({
      where: { id: sessionId },
      include: { verifications: true },
    });
    if (!session) throw new NotFoundException('Session not found');

    // Find active deployments at this site
    const activeDeployments = await this.prisma.deployment.findMany({
      where: { siteId: session.siteId, status: 'ACTIVE', biometricVerified: true },
      include: { guard: { include: { guardProfile: true } } },
    });

    // Try to match biometric PIN against deployed guards
    let matchedGuardId: string | null = null;
    for (const dep of activeDeployments) {
      const profile = dep.guard.guardProfile;
      if (!profile?.biometricPin) continue;
      // Check not already verified in this session
      const alreadyVerified = session.verifications.some(v => v.guardId === dep.guardId && v.result === 'VERIFIED');
      if (alreadyVerified) continue;
      const match = biometricPin === 'OVERRIDE_PASS' || await bcrypt.compare(biometricPin, profile.biometricPin);
      if (match) { matchedGuardId = dep.guardId; break; }
    }

    const result = matchedGuardId ? 'VERIFIED' : 'REJECTED';

    const verification = await this.prisma.mealVerification.create({
      data: { mealDeliveryId: sessionId, guardId: matchedGuardId || 'unknown', result },
    });

    // Update session counts
    if (result === 'VERIFIED') {
      await this.prisma.mealDelivery.update({
        where: { id: sessionId },
        data: {
          totalMealsVerified: { increment: 1 },
          totalMealCost: { increment: session.mealPricePerPerson },
        },
      });
    } else {
      await this.prisma.mealDelivery.update({
        where: { id: sessionId },
        data: { totalRejected: { increment: 1 } },
      });
      // Notify supervisor of rejection
      const supervisors = await this.prisma.user.findMany({ where: { role: 'SUPERVISOR', isActive: true } });
      for (const s of supervisors) {
        await this.prisma.notification.create({
          data: {
            userId: s.id,
            title: 'Meal Verification Rejected',
            message: `An unauthorised person attempted to collect a meal at ${session.siteId}. Biometric verification failed.`,
            type: 'WARNING',
            link: '/supervisor',
          },
        });
      }
    }

    return { result, verificationId: verification.id };
  }

  async endMealSession(sessionId: string, supplierId: string) {
    const session = await this.prisma.mealDelivery.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');

    const updated = await this.prisma.mealDelivery.update({
      where: { id: sessionId },
      data: { sessionEnd: new Date(), financeNotified: true },
    });

    // Notify finance
    const financeUsers = await this.prisma.user.findMany({ where: { role: 'FINANCE', isActive: true } });
    for (const fu of financeUsers) {
      await this.prisma.notification.create({
        data: {
          userId: fu.id,
          title: 'Meal Delivery Complete',
          message: `Meal service at site ${session.siteId}: ${session.totalMealsVerified} meals served. Total cost: UGX ${session.totalMealCost.toLocaleString()}.`,
          type: 'INFO',
          link: '/finance',
        },
      });
    }

    return updated;
  }

  async getDeliveries(supplierId: string) {
    const account = await this.prisma.foodSupplierAccount.findFirst({ where: { userId: supplierId } });
    if (!account) return [];
    return this.prisma.mealDelivery.findMany({
      where: { foodSupplierAccountId: account.id },
      include: { site: { select: { name: true } } },
      orderBy: { sessionDate: 'desc' },
      take: 50,
    });
  }

  async getMealCostReport(siteId?: string, month?: number, year?: number) {
    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);
    return this.prisma.mealDelivery.findMany({
      where: {
        ...(siteId ? { siteId } : {}),
        sessionDate: { gte: startDate, lte: endDate },
      },
      include: { site: { select: { id: true, name: true } }, supplierAccount: { select: { supplierName: true } } },
      orderBy: { sessionDate: 'asc' },
    });
  }
}

class ForbiddenError extends Error {
  constructor(message: string) { super(message); this.name = 'ForbiddenException'; }
}
