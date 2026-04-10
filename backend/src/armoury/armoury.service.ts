import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ArmouryService {
  constructor(private prisma: PrismaService) {}

  // === WEAPONS ===
  async findAllWeapons(status?: string) {
    return this.prisma.weaponRecord.findMany({
      where: status ? { status } : {},
      include: { issuances: { where: { isReturned: false }, include: { guard: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findWeapon(id: string) {
    const weapon = await this.prisma.weaponRecord.findUnique({
      where: { id },
      include: { issuances: { include: { guard: { select: { id: true, name: true } }, site: { select: { id: true, name: true } } }, orderBy: { issueTimestamp: 'desc' }, take: 20 } },
    });
    if (!weapon) throw new NotFoundException('Weapon not found');
    return weapon;
  }

  async createWeapon(data: any) {
    return this.prisma.weaponRecord.create({ data: { ...data, licenceExpiry: data.licenceExpiry ? new Date(data.licenceExpiry) : null } });
  }

  async updateWeapon(id: string, data: any) {
    await this.findWeapon(id);
    return this.prisma.weaponRecord.update({ where: { id }, data });
  }

  // === ISSUANCES ===
  async findAllIssuances(siteId?: string, guardId?: string, isReturned?: boolean) {
    return this.prisma.weaponIssuance.findMany({
      where: {
        ...(siteId ? { siteId } : {}),
        ...(guardId ? { guardId } : {}),
        ...(isReturned !== undefined ? { isReturned } : {}),
      },
      include: {
        weapon: true,
        guard: { select: { id: true, name: true, staffId: true } },
        supervisor: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
      },
      orderBy: { issueTimestamp: 'desc' },
      take: 100,
    });
  }

  async createIssuance(data: any, supervisorId: string) {
    const weapon = await this.prisma.weaponRecord.findUnique({ where: { id: data.weaponId } });
    if (!weapon) throw new NotFoundException('Weapon not found');
    if (weapon.status !== 'AVAILABLE') throw new BadRequestException(`Weapon is ${weapon.status} and cannot be issued`);

    // Check weapon licence expiry
    if (weapon.licenceExpiry && new Date(weapon.licenceExpiry) < new Date()) {
      throw new BadRequestException('Weapon licence has expired. Cannot issue this weapon.');
    }

    const [issuance] = await this.prisma.$transaction([
      this.prisma.weaponIssuance.create({
        data: { ...data, supervisorId, roundsIssued: data.roundsIssued || 0 },
        include: { weapon: true, guard: { select: { id: true, name: true } } },
      }),
      this.prisma.weaponRecord.update({ where: { id: data.weaponId }, data: { status: 'ISSUED' } }),
    ]);

    return issuance;
  }

  async returnWeapon(id: string, data: any, armouryOfficerId: string) {
    const issuance = await this.prisma.weaponIssuance.findUnique({ where: { id }, include: { weapon: true } });
    if (!issuance) throw new NotFoundException('Issuance record not found');
    if (issuance.isReturned) throw new BadRequestException('Weapon already returned');

    if (data.roundsReturned !== undefined && data.roundsReturned !== issuance.roundsIssued) {
      await this.prisma.notification.create({
        data: {
          userId: armouryOfficerId,
          title: 'Ammunition Discrepancy',
          message: `Weapon ${issuance.weapon.serialNumber}: ${issuance.roundsIssued} rounds issued, ${data.roundsReturned} returned. Discrepancy of ${issuance.roundsIssued - data.roundsReturned} rounds.`,
          type: 'ALERT',
        },
      });
    }

    const newStatus = data.returnCondition === 'DAMAGED' ? 'UNDER_MAINTENANCE' : 'AVAILABLE';

    await this.prisma.$transaction([
      this.prisma.weaponIssuance.update({
        where: { id },
        data: { isReturned: true, returnTimestamp: new Date(), returnCondition: data.returnCondition, roundsReturned: data.roundsReturned, armouryOfficerId },
      }),
      this.prisma.weaponRecord.update({ where: { id: issuance.weaponId }, data: { status: newStatus } }),
    ]);

    return { message: 'Weapon return confirmed', newStatus };
  }

  // === AMMUNITION ===
  async getAmmunitionStock(siteId?: string) {
    return this.prisma.ammunitionStock.findMany({
      where: siteId ? { siteId } : {},
      include: { site: { select: { id: true, name: true } } },
      orderBy: [{ siteId: 'asc' }, { calibre: 'asc' }],
    });
  }

  async updateAmmunitionStock(data: any) {
    return this.prisma.ammunitionStock.upsert({
      where: { siteId_calibre_type: { siteId: data.siteId, calibre: data.calibre, type: data.type } },
      create: data,
      update: { quantity: data.quantity, ...(data.minStock ? { minStock: data.minStock } : {}) },
    });
  }

  // === REPORTS ===
  async getWeaponsIssuedReport(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate) where.issueTimestamp = { gte: new Date(startDate) };
    if (endDate) where.issueTimestamp = { ...where.issueTimestamp, lte: new Date(endDate) };
    return this.prisma.weaponIssuance.findMany({
      where,
      include: {
        weapon: { select: { serialNumber: true, weaponType: true } },
        guard: { select: { name: true, staffId: true } },
        site: { select: { name: true } },
      },
      orderBy: { issueTimestamp: 'desc' },
    });
  }

  async getLicenceExpiryReport() {
    const sixtyDaysFromNow = new Date(); sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
    return this.prisma.weaponRecord.findMany({
      where: {
        licenceExpiry: { lte: sixtyDaysFromNow },
        status: { not: 'DECOMMISSIONED' },
      },
      orderBy: { licenceExpiry: 'asc' },
    });
  }
}
