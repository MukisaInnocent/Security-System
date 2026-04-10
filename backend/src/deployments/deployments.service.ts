import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeploymentDto, UpdateDeploymentDto } from './dto/deployment.dto';

@Injectable()
export class DeploymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { date?: string; siteId?: string; guardId?: string; status?: string }) {
    const where: any = {};
    if (filters?.siteId) where.siteId = filters.siteId;
    if (filters?.guardId) where.guardId = filters.guardId;
    if (filters?.status) where.status = filters.status;
    if (filters?.date) {
      const d = new Date(filters.date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.date = { gte: d, lt: next };
    }

    return this.prisma.deployment.findMany({
      where,
      include: {
        guard: { select: { id: true, name: true, email: true, phone: true } },
        site: { select: { id: true, name: true, address: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const deployment = await this.prisma.deployment.findUnique({
      where: { id },
      include: {
        guard: { select: { id: true, name: true, email: true, phone: true } },
        site: true,
      },
    });
    if (!deployment) throw new NotFoundException('Deployment not found');
    return deployment;
  }

  async create(dto: CreateDeploymentDto, userId: string) {
    const deployment = await this.prisma.deployment.create({
      data: {
        guardId: dto.guardId,
        siteId: dto.siteId,
        shiftStart: dto.shiftStart,
        shiftEnd: dto.shiftEnd,
        date: new Date(dto.date),
        notes: dto.notes,
      },
      include: {
        guard: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entity: 'Deployment',
        entityId: deployment.id,
        metadata: JSON.stringify({
          guard: deployment.guard.name,
          site: deployment.site.name,
          date: dto.date,
        }),
      },
    });

    return deployment;
  }

  async update(id: string, dto: UpdateDeploymentDto, userId: string) {
    await this.findOne(id);

    const data: any = { ...dto };
    if (dto.date) data.date = new Date(dto.date);

    const deployment = await this.prisma.deployment.update({
      where: { id },
      data,
      include: {
        guard: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Deployment',
        entityId: id,
        metadata: JSON.stringify(dto),
      },
    });

    return deployment;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id);

    await this.prisma.deployment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'Deployment',
        entityId: id,
      },
    });

    return { message: 'Deployment cancelled successfully' };
  }
}
