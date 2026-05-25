import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PersonnelMovementsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    guardId: string;
    movementType: string;
    fromSiteId?: string;
    toSiteId?: string;
    reason: string;
    effectiveDate: string;
    notes?: string;
  }) {
    return this.prisma.personnelMovement.create({
      data: {
        ...data,
        effectiveDate: new Date(data.effectiveDate),
      },
    });
  }

  async findAll(guardId?: string, status?: string, movementType?: string) {
    const where: any = {};
    if (guardId) where.guardId = guardId;
    if (status) where.status = status;
    if (movementType) where.movementType = movementType;

    const movements = await this.prisma.personnelMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with guard names and site names
    const guardIds = [...new Set(movements.map(m => m.guardId))];
    const siteIds = [...new Set([
      ...movements.map(m => m.fromSiteId).filter(Boolean),
      ...movements.map(m => m.toSiteId).filter(Boolean),
    ])] as string[];

    const [guards, sites] = await Promise.all([
      this.prisma.user.findMany({ where: { id: { in: guardIds } }, select: { id: true, name: true, staffId: true } }),
      this.prisma.site.findMany({ where: { id: { in: siteIds } }, select: { id: true, name: true } }),
    ]);

    const guardMap = Object.fromEntries(guards.map(g => [g.id, g]));
    const siteMap = Object.fromEntries(sites.map(s => [s.id, s]));

    return movements.map(m => ({
      ...m,
      guard: guardMap[m.guardId] || null,
      fromSite: m.fromSiteId ? siteMap[m.fromSiteId] || null : null,
      toSite: m.toSiteId ? siteMap[m.toSiteId] || null : null,
    }));
  }

  async approve(id: string, approverId: string, approved: boolean) {
    return this.prisma.personnelMovement.update({
      where: { id },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        approvedById: approverId,
      },
    });
  }

  async complete(id: string) {
    const movement = await this.prisma.personnelMovement.findUnique({ where: { id } });
    if (!movement) throw new Error('Movement not found');

    // If it's a transfer and approved, update the guard's primary site
    if (movement.movementType === 'TRANSFER' && movement.toSiteId) {
      await this.prisma.guardProfile.updateMany({
        where: { userId: movement.guardId },
        data: { primarySiteId: movement.toSiteId },
      });
    }

    return this.prisma.personnelMovement.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
  }
}
