import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogisticsService {
  constructor(private prisma: PrismaService) {}

  async findAllDistributions(siteId?: string) {
    return this.prisma.assetDistribution.findMany({
      where: siteId ? { destinationSiteId: siteId } : {},
      orderBy: { deliveryDate: 'desc' },
      take: 200,
    });
  }

  async createDistribution(data: any, logisticsOfficerId: string) {
    const distribution = await this.prisma.assetDistribution.create({
      data: { ...data, logisticsOfficerId, deliveryDate: new Date(data.deliveryDate) },
    });

    // Update site inventory if destination is a site
    if (data.destinationSiteId) {
      await this.prisma.siteInventory.upsert({
        where: {
          siteId_equipmentType_itemDescription: {
            siteId: data.destinationSiteId,
            equipmentType: data.equipmentType,
            itemDescription: data.itemDescription,
          },
        },
        create: {
          siteId: data.destinationSiteId,
          equipmentType: data.equipmentType,
          itemDescription: data.itemDescription,
          quantity: data.quantity,
          lastUpdated: new Date(),
        },
        update: {
          quantity: { increment: data.quantity },
          lastUpdated: new Date(),
        },
      });
    }

    return distribution;
  }

  async getSiteInventory(siteId?: string) {
    const inventory = await this.prisma.siteInventory.findMany({
      where: siteId ? { siteId } : {},
      include: { site: { select: { id: true, name: true } } },
      orderBy: [{ siteId: 'asc' }, { equipmentType: 'asc' }],
    });

    // Flag low stock items
    return inventory.map(item => ({
      ...item,
      isLowStock: item.quantity <= item.minThreshold,
    }));
  }

  async getLowStockAlerts() {
    const lowStock = await this.prisma.siteInventory.findMany({
      where: { quantity: { lte: this.prisma.siteInventory.fields.minThreshold } as any },
      include: { site: { select: { id: true, name: true } } },
    });
    // Fallback: fetch all and filter
    const all = await this.prisma.siteInventory.findMany({ include: { site: { select: { id: true, name: true } } } });
    return all.filter(i => i.quantity <= i.minThreshold).map(i => ({ ...i, isLowStock: true }));
  }

  async recordTransfer(data: any) {
    const { fromSiteId, toSiteId, equipmentType, itemDescription, quantity, reason } = data;

    // Decrement from source, increment destination
    await this.prisma.$transaction([
      this.prisma.siteInventory.updateMany({
        where: { siteId: fromSiteId, equipmentType, itemDescription },
        data: { quantity: { decrement: quantity }, lastUpdated: new Date() },
      }),
      this.prisma.siteInventory.upsert({
        where: { siteId_equipmentType_itemDescription: { siteId: toSiteId, equipmentType, itemDescription } },
        create: { siteId: toSiteId, equipmentType, itemDescription, quantity, lastUpdated: new Date() },
        update: { quantity: { increment: quantity }, lastUpdated: new Date() },
      }),
    ]);

    return { message: 'Transfer recorded successfully', data };
  }

  async getDistributionReport(startDate?: string, endDate?: string) {
    return this.prisma.assetDistribution.findMany({
      where: {
        ...(startDate ? { deliveryDate: { gte: new Date(startDate) } } : {}),
        ...(endDate ? { deliveryDate: { lte: new Date(endDate) } } : {}),
      },
      orderBy: { deliveryDate: 'desc' },
    });
  }
}
