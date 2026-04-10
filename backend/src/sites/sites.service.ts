import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSiteDto, UpdateSiteDto } from './dto/site.dto';

@Injectable()
export class SitesService {
  constructor(private prisma: PrismaService) {}

  async findAll(activeOnly = true) {
    const where: any = {};
    if (activeOnly) where.isActive = true;

    return this.prisma.site.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const site = await this.prisma.site.findUnique({ where: { id } });
    if (!site) throw new NotFoundException('Site not found');
    return site;
  }

  async create(dto: CreateSiteDto, userId: string) {
    const site = await this.prisma.site.create({ data: dto });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entity: 'Site',
        entityId: site.id,
        metadata: JSON.stringify({ name: site.name }),
      },
    });

    return site;
  }

  async update(id: string, dto: UpdateSiteDto, userId: string) {
    await this.findOne(id);

    const site = await this.prisma.site.update({
      where: { id },
      data: dto,
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Site',
        entityId: site.id,
        metadata: JSON.stringify(dto),
      },
    });

    return site;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id);

    await this.prisma.site.update({
      where: { id },
      data: { isActive: false },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'Site',
        entityId: id,
      },
    });

    return { message: 'Site deactivated successfully' };
  }
}
