import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegionDto, UpdateRegionDto } from './dto/region.dto';

@Injectable()
export class RegionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId?: string) {
    return this.prisma.region.findMany({
      where: { isActive: true, ...(tenantId ? { tenantId } : {}) },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        _count: { select: { sites: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const region = await this.prisma.region.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        sites: {
          where: { isActive: true },
          include: {
            _count: { select: { deployments: true, incidents: true } },
          },
        },
      },
    });
    if (!region) throw new NotFoundException('Region not found');
    return region;
  }

  async getDashboard(id: string) {
    const region = await this.findOne(id);
    const siteIds = region.sites.map(s => s.id);
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);

    const [activeDeployments, openIncidents, totalGuards] = await Promise.all([
      this.prisma.deployment.count({ where: { siteId: { in: siteIds }, status: 'ACTIVE' } }),
      this.prisma.incident.count({ where: { siteId: { in: siteIds }, status: { in: ['OPEN','IN_PROGRESS'] } } }),
      this.prisma.deployment.count({ where: { siteId: { in: siteIds }, date: { gte: today, lt: tomorrow } } }),
    ]);

    return { region, activeDeployments, openIncidents, totalGuards };
  }

  async create(dto: CreateRegionDto, tenantId: string) {
    return this.prisma.region.create({
      data: { ...dto, tenantId },
      include: { manager: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, dto: UpdateRegionDto) {
    await this.findOne(id);
    return this.prisma.region.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.region.update({ where: { id }, data: { isActive: false } });
  }
}
