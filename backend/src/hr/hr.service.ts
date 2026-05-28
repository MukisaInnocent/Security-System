import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  async getAllGuardProfiles() {
    return this.prisma.user.findMany({
      where: { role: { in: ['GUARD', 'SUPERVISOR'] }, isActive: true },
      include: {
        guardProfile: { include: { primarySite: { select: { id: true, name: true } } } },
        leaveRequests: { where: { status: 'APPROVED', startDate: { lte: new Date() }, endDate: { gte: new Date() } } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getGuardProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        guardProfile: { include: { nextOfKins: true } },
        deployments: { where: { status: 'COMPLETED' }, orderBy: { date: 'desc' }, take: 10 },
        leaveRequests: { orderBy: { createdAt: 'desc' }, take: 5 },
        chargesReceived: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!user) throw new NotFoundException('Guard not found');
    return user;
  }

  async upsertGuardProfile(userId: string, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const { nextOfKin, references, bankDetails, paymentMode, mobileMoneyNumber, ...guardProfileData } = data;

    if (guardProfileData.biometricPin) {
      guardProfileData.biometricPin = await bcrypt.hash(guardProfileData.biometricPin, 10);
      guardProfileData.biometricEnrolled = true;
    }

    const profile = await this.prisma.guardProfile.upsert({
      where: { userId },
      create: { userId, ...guardProfileData },
      update: guardProfileData,
    });

    if (Array.isArray(nextOfKin) && nextOfKin.length > 0) {
      await this.prisma.nextOfKin.deleteMany({ where: { guardProfileId: profile.id } });
      await this.prisma.nextOfKin.createMany({
        data: nextOfKin.map((nok: any) => ({
          guardProfileId: profile.id,
          name: nok.name || 'Unknown',
          phone: nok.phone,
          relationship: nok.relationship,
          address: nok.address,
          nin: nok.nin,
        })),
      });
    }

    return this.prisma.guardProfile.findUnique({
      where: { id: profile.id },
      include: { nextOfKins: true },
    });
  }

  async updateWeaponAuthorisation(userId: string, authorised: boolean) {
    return this.prisma.guardProfile.upsert({
      where: { userId },
      create: { userId, weaponAuthorised: authorised },
      update: { weaponAuthorised: authorised },
    });
  }

  async getWeaponAuthorisationRegistry() {
    return this.prisma.user.findMany({
      where: { role: { in: ['GUARD', 'SUPERVISOR'] }, isActive: true },
      select: {
        id: true, name: true, staffId: true, email: true,
        guardProfile: { select: { weaponAuthorised: true, biometricEnrolled: true, monthlySalary: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  // Leave requests
  async getAllLeaveRequests(status?: string) {
    return this.prisma.leaveRequest.findMany({
      where: status ? { status } : {},
      include: {
        guard: { select: { id: true, name: true, staffId: true } },
        approver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createLeaveRequest(guardId: string, data: any) {
    // Check if guard is not already on approved leave for those dates
    const conflict = await this.prisma.leaveRequest.findFirst({
      where: {
        guardId,
        status: 'APPROVED',
        OR: [
          { startDate: { lte: new Date(data.endDate) }, endDate: { gte: new Date(data.startDate) } },
        ],
      },
    });
    if (conflict) throw new BadRequestException('Guard already has approved leave for those dates');

    return this.prisma.leaveRequest.create({
      data: { guardId, ...data },
      include: { guard: { select: { id: true, name: true } } },
    });
  }

  async approveLeaveRequest(id: string, approverId: string, approved: boolean, rejectReason?: string) {
    const lr = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!lr) throw new NotFoundException('Leave request not found');

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        approverId,
        rejectReason: !approved ? rejectReason : null,
      },
      include: { guard: { select: { id: true, name: true } } },
    });

    // Notify the guard
    await this.prisma.notification.create({
      data: {
        userId: lr.guardId,
        title: `Leave Request ${approved ? 'Approved' : 'Rejected'}`,
        message: `Your leave request from ${lr.startDate.toDateString()} to ${lr.endDate.toDateString()} has been ${approved ? 'approved' : 'rejected'}${!approved && rejectReason ? ': ' + rejectReason : ''}.`,
        type: approved ? 'INFO' : 'WARNING',
        link: `/hr/leave?id=${lr.id}`,
      },
    });

    return updated;
  }

  async isGuardOnLeave(guardId: string, date?: Date): Promise<boolean> {
    const checkDate = date || new Date();
    const leave = await this.prisma.leaveRequest.findFirst({
      where: { guardId, status: 'APPROVED', startDate: { lte: checkDate }, endDate: { gte: checkDate } },
    });
    return !!leave;
  }
}
