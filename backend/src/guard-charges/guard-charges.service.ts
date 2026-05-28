import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class GuardChargesService {
  constructor(private prisma: PrismaService) {}

  async createCharge(raisedById: string, data: { guardId: string; chargeCategory: string; chargeDescription: string; severityLevel: string; amount: number; evidenceUrl?: string }) {
    return this.prisma.guardCharge.create({
      data: {
        raisedById,
        ...data,
      },
    });
  }

  async getAllCharges() {
    return this.prisma.guardCharge.findMany({
      include: {
        guard: { select: { id: true, name: true, staffId: true } },
        raisedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOperationsStatus(chargeId: string, status: string) {
    return this.prisma.guardCharge.update({
      where: { id: chargeId },
      data: { operationsStatus: status },
    });
  }

  async getChargesForGuard(guardId: string) {
    return this.prisma.guardCharge.findMany({
      where: { guardId },
      include: {
        raisedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async confirmCharge(chargeId: string, guardId: string, pin: string) {
    const charge = await this.prisma.guardCharge.findUnique({
      where: { id: chargeId },
      include: { guard: { include: { guardProfile: true } } },
    });

    if (!charge) throw new NotFoundException('Charge not found');
    if (charge.guardId !== guardId) throw new BadRequestException('Not your charge');
    if (charge.status !== 'PENDING') throw new BadRequestException('Charge is not pending');

    // Verify "Fingerprint" / PIN
    const profile = charge.guard.guardProfile;
    if (!profile || !profile.biometricPin) {
      throw new BadRequestException('Guard has no biometric PIN registered');
    }

    const isValid = await bcrypt.compare(pin, profile.biometricPin);
    if (!isValid) throw new BadRequestException('Invalid fingerprint/PIN');

    return this.prisma.guardCharge.update({
      where: { id: chargeId },
      data: {
        status: 'CONFIRMED',
        guardConfirmed: true,
        guardFingerprint: 'Biometric-Signature-Verified',
      },
    });
  }

  async voidCharge(chargeId: string, managerId: string) {
    const charge = await this.prisma.guardCharge.findUnique({ where: { id: chargeId } });
    if (!charge) throw new NotFoundException('Charge not found');

    return this.prisma.guardCharge.update({
      where: { id: chargeId },
      data: { status: 'VOIDED', operationsStatus: 'VOIDED' },
    });
  }
}
