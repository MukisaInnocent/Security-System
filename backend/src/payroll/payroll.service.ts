import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  async getPayrollRecords(month?: number, year?: number, status?: string) {
    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();
    return this.prisma.payrollRecord.findMany({
      where: { payrollMonth: m, payrollYear: y, ...(status ? { status } : {}) },
      include: { guard: { select: { id: true, name: true, staffId: true, role: true } } },
      orderBy: [{ guard: { name: 'asc' } }],
    });
  }

  async getGuardPayroll(guardId: string, requesterId: string, requesterRole: string) {
    if (!['FINANCE','HR','CEO','ADMIN'].includes(requesterRole) && guardId !== requesterId) {
      throw new ForbiddenException('You can only view your own payroll records');
    }
    return this.prisma.payrollRecord.findMany({
      where: { guardId },
      include: { guard: { select: { id: true, name: true, staffId: true } } },
      orderBy: [{ payrollYear: 'desc' }, { payrollMonth: 'desc' }],
    });
  }

  async generatePayrollRun(month: number, year: number) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month - 1, daysInMonth, 23, 59, 59);

    const guards = await this.prisma.user.findMany({
      where: { role: { in: ['GUARD', 'SUPERVISOR'] }, isActive: true },
      include: { guardProfile: true },
    });

    const results = [];

    for (const guard of guards) {
      const monthlySalary = guard.guardProfile?.monthlySalary || 0;
      const dailyRate = monthlySalary / daysInMonth;

      // Count completed deployments (biometric sign-in AND sign-out)
      const completedShifts = await this.prisma.deployment.count({
        where: {
          guardId: guard.id,
          status: 'COMPLETED',
          date: { gte: startDate, lte: endDate },
          biometricVerified: true,
        },
      });

      const overtimeShifts = await this.prisma.deployment.count({
        where: {
          guardId: guard.id,
          status: 'COMPLETED',
          date: { gte: startDate, lte: endDate },
          deploymentType: { in: ['CROSS_SITE', 'OVERTIME'] },
        },
      });

      const totalPayroll = dailyRate * completedShifts;

      // Actually fetch special duties with payment amounts
      const specialDuties = await this.prisma.specialDutyPersonnel.findMany({
        where: {
          userId: guard.id,
          attendanceStatus: 'ATTENDED',
          specialDuty: { date: { gte: startDate, lte: endDate }, status: 'COMPLETED' },
        },
        include: { specialDuty: { select: { paymentPerPerson: true } } },
      });
      const specialDutyPay = specialDuties.reduce((sum, sdp) => sum + (sdp.specialDuty?.paymentPerPerson || 0), 0);


      const record = await this.prisma.payrollRecord.upsert({
        where: { guardId_payrollMonth_payrollYear: { guardId: guard.id, payrollMonth: month, payrollYear: year } },
        create: {
          guardId: guard.id,
          payrollMonth: month,
          payrollYear: year,
          monthlySalary,
          totalDaysInMonth: daysInMonth,
          dailyRate,
          totalShiftsWorked: completedShifts,
          overtimeShifts,
          totalPayrollAmount: totalPayroll,
          netPay: totalPayroll,
          specialDutyTotal: specialDutyPay,
          status: 'DRAFT',
        },
        update: {
          monthlySalary,
          totalDaysInMonth: daysInMonth,
          dailyRate,
          totalShiftsWorked: completedShifts,
          overtimeShifts,
          totalPayrollAmount: totalPayroll,
          netPay: totalPayroll,
          specialDutyTotal: specialDutyPay,
          status: 'DRAFT',
        },
      });

      results.push(record);
    }

    return { generated: results.length, month, year, records: results };
  }

  async approvePayroll(id: string, approverId: string) {
    const record = await this.prisma.payrollRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Payroll record not found');
    return this.prisma.payrollRecord.update({
      where: { id },
      data: { status: 'APPROVED', approvedById: approverId, approvedAt: new Date(), lockedAt: new Date() },
    });
  }

  async getCurrentMonthSummary(guardId: string) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDate = new Date(year, month - 1, 1);
    const guard = await this.prisma.user.findUnique({ where: { id: guardId }, include: { guardProfile: true } });
    if (!guard) throw new NotFoundException('Guard not found');
    const monthlySalary = guard.guardProfile?.monthlySalary || 0;
    const dailyRate = monthlySalary / daysInMonth;
    const shiftsWorked = await this.prisma.deployment.count({
      where: { guardId, status: 'COMPLETED', date: { gte: startDate }, biometricVerified: true },
    });
    return {
      guardId,
      guardName: guard.name,
      month, year,
      monthlySalary,
      dailyRate,
      shiftsWorked,
      runningTotal: dailyRate * shiftsWorked,
      estimatedMonthEnd: dailyRate * daysInMonth,
    };
  }

  async getPayrollReport(month: number, year: number) {
    const records = await this.getPayrollRecords(month, year);
    const totalNet = records.reduce((sum, r) => sum + r.netPay, 0);
    const totalGross = records.reduce((sum, r) => sum + r.totalPayrollAmount, 0);
    return { records, totalGross, totalNet, month, year, count: records.length };
  }
}
