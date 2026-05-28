import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OvertimeService {
  constructor(private prisma: PrismaService) {}

  async getOvertimeRecords(siteId?: string, guardId?: string, status?: string) {
    const where: any = {};
    if (siteId) where.siteId = siteId;
    if (guardId) where.guardId = guardId;
    if (status) where.status = status;

    return this.prisma.overtimeRecord.findMany({
      where,
      include: {
        guard: { select: { id: true, name: true, staffId: true } },
        site: { select: { id: true, name: true } },
        supervisor: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async createOvertimeRecord(data: any, supervisorId: string) {
    return this.prisma.overtimeRecord.create({
      data: {
        guardId: data.guardId,
        siteId: data.siteId,
        date: new Date(data.date),
        hours: data.hours,
        notes: data.notes,
        supervisorId,
        status: 'PENDING',
      },
    });
  }

  async approveOvertime(id: string, approved: boolean, notes?: string) {
    return this.prisma.overtimeRecord.update({
      where: { id },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        notes: notes || undefined,
      },
    });
  }
}
