import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChangeSheetsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    guardId: string;
    changeType: string;
    reason: string;
    amount?: number;
    evidence?: string;
    mediaUrl?: string;
    serialOrBiometric?: string;
    previousValue?: string;
    newValue?: string;
  }) {
    return this.prisma.changeSheet.create({ data });
  }

  async findAll(guardId?: string, status?: string, changeType?: string) {
    const where: any = {};
    if (guardId) where.guardId = guardId;
    if (status) where.status = status;
    if (changeType) where.changeType = changeType;
    
    const sheets = await this.prisma.changeSheet.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with guard names
    const guardIds = [...new Set(sheets.map(s => s.guardId))];
    const guards = await this.prisma.user.findMany({
      where: { id: { in: guardIds } },
      select: { id: true, name: true, staffId: true },
    });
    const guardMap = Object.fromEntries(guards.map(g => [g.id, g]));

    return sheets.map(s => ({
      ...s,
      guard: guardMap[s.guardId] || null,
    }));
  }

  async findOne(id: string) {
    const sheet = await this.prisma.changeSheet.findUnique({ where: { id } });
    if (!sheet) return null;
    const guard = await this.prisma.user.findUnique({
      where: { id: sheet.guardId },
      select: { id: true, name: true, staffId: true, phone: true },
    });
    return { ...sheet, guard };
  }

  async approve(id: string, approverId: string, approved: boolean) {
    return this.prisma.changeSheet.update({
      where: { id },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        approvedById: approverId,
        approvedAt: approved ? new Date() : null,
      },
    });
  }
}
