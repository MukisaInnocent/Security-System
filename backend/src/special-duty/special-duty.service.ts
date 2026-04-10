import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SpecialDutyService {
  constructor(private prisma: PrismaService) {}

  async findAll(status?: string) {
    return this.prisma.specialDuty.findMany({
      where: status ? { status } : {},
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        personnel: { include: { user: { select: { id: true, name: true, role: true, staffId: true } } } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const duty = await this.prisma.specialDuty.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
        personnel: { include: { user: { select: { id: true, name: true, role: true, staffId: true, phone: true } } } },
      },
    });
    if (!duty) throw new NotFoundException('Special duty not found');
    return duty;
  }

  async create(data: any, createdById: string) {
    const { personnelIds, ...dutyData } = data;

    // Check none of the selected personnel are on leave for that date
    const dutyDate = new Date(dutyData.date);
    for (const userId of (personnelIds || [])) {
      const onLeave = await this.prisma.leaveRequest.findFirst({
        where: { guardId: userId, status: 'APPROVED', startDate: { lte: dutyDate }, endDate: { gte: dutyDate } },
      });
      if (onLeave) {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        throw new BadRequestException(`${user?.name} is on approved leave on that date.`);
      }
    }

    const duty = await this.prisma.specialDuty.create({
      data: {
        ...dutyData,
        createdById,
        date: dutyDate,
        responseDeadline: dutyData.responseDeadline ? new Date(dutyData.responseDeadline) : null,
        totalPaymentLiability: (personnelIds?.length || 0) * (dutyData.paymentPerPerson || 0),
        personnel: personnelIds?.length ? {
          create: personnelIds.map((userId: string) => ({ userId })),
        } : undefined,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        personnel: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    // Send notifications to all selected personnel
    for (const p of duty.personnel) {
      await this.prisma.notification.create({
        data: {
          userId: p.userId,
          title: `Special Duty Assignment: ${duty.title}`,
          message: `You have been selected for "${duty.title}" on ${dutyDate.toDateString()} at ${duty.location}. Payment: UGX ${duty.paymentPerPerson.toLocaleString()}. Please confirm or decline.`,
          type: 'INFO',
        },
      });
    }

    return duty;
  }

  async respond(id: string, userId: string, confirmed: boolean, declineReason?: string) {
    const personnel = await this.prisma.specialDutyPersonnel.findFirst({
      where: { specialDutyId: id, userId },
    });
    if (!personnel) throw new NotFoundException('You are not assigned to this special duty');

    return this.prisma.specialDutyPersonnel.update({
      where: { id: personnel.id },
      data: {
        confirmStatus: confirmed ? 'CONFIRMED' : 'DECLINED',
        declineReason: !confirmed ? declineReason : null,
        respondedAt: new Date(),
      },
    });
  }

  async markAttendance(id: string, userId: string, attended: boolean) {
    const personnel = await this.prisma.specialDutyPersonnel.findFirst({
      where: { specialDutyId: id, userId, confirmStatus: 'CONFIRMED' },
    });
    if (!personnel) throw new NotFoundException('Personnel record not found or not confirmed');

    return this.prisma.specialDutyPersonnel.update({
      where: { id: personnel.id },
      data: {
        attendanceStatus: attended ? 'ATTENDED' : 'NO_SHOW',
        biometricVerified: attended,
      },
    });
  }

  async complete(id: string) {
    const duty = await this.findOne(id);
    const attended = duty.personnel.filter((p: any) => p.attendanceStatus === 'ATTENDED');
    const totalLiability = attended.length * duty.paymentPerPerson;

    await this.prisma.specialDuty.update({
      where: { id },
      data: { status: 'COMPLETED', totalPaymentLiability: totalLiability, financeNotified: true },
    });

    // Notify finance
    const financeUsers = await this.prisma.user.findMany({ where: { role: 'FINANCE', isActive: true } });
    for (const fu of financeUsers) {
      await this.prisma.notification.create({
        data: {
          userId: fu.id,
          title: `Special Duty Payment Required: ${duty.title}`,
          message: `Special duty "${duty.title}" completed. ${attended.length} personnel attended. Total payment due: UGX ${totalLiability.toLocaleString()}.`,
          type: 'ALERT',
        },
      });
    }

    return { message: 'Special duty marked complete', attended: attended.length, totalLiability };
  }

  async cancel(id: string, reason: string) {
    const duty = await this.findOne(id);
    await this.prisma.specialDuty.update({ where: { id }, data: { status: 'CANCELLED', cancellationReason: reason } });

    for (const p of duty.personnel) {
      await this.prisma.notification.create({
        data: {
          userId: p.userId,
          title: `Special Duty Cancelled: ${duty.title}`,
          message: `The special duty assignment "${duty.title}" on ${duty.date.toDateString()} has been cancelled. Reason: ${reason}`,
          type: 'WARNING',
        },
      });
    }
    return { message: 'Cancelled and personnel notified' };
  }
}
