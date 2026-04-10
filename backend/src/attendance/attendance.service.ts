import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckInDto, CheckOutDto, SyncAttendanceDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate distance between two GPS coordinates using Haversine formula
   * Returns distance in meters
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Check if GPS coordinates are within site geofence
   */
  private async isWithinGeofence(
    siteId: string,
    latitude: number,
    longitude: number,
  ): Promise<boolean> {
    const site = await this.prisma.site.findUnique({ where: { id: siteId } });
    if (!site) return false;

    const distance = this.calculateDistance(
      site.latitude,
      site.longitude,
      latitude,
      longitude,
    );

    return distance <= site.geofenceRadius;
  }

  async checkIn(guardId: string, dto: CheckInDto) {
    const withinGeofence = await this.isWithinGeofence(
      dto.siteId,
      dto.latitude,
      dto.longitude,
    );

    // Check for duplicate offline records
    if (dto.offlineId) {
      const existing = await this.prisma.attendance.findFirst({
        where: { offlineId: dto.offlineId },
      });
      if (existing) return existing;
    }

    const attendance = await this.prisma.attendance.create({
      data: {
        guardId,
        siteId: dto.siteId,
        deploymentId: dto.deploymentId,
        type: 'CHECK_IN',
        latitude: dto.latitude,
        longitude: dto.longitude,
        isWithinGeofence: withinGeofence,
        syncedFromOffline: dto.syncedFromOffline || false,
        offlineId: dto.offlineId,
        timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
      },
      include: {
        site: { select: { id: true, name: true } },
      },
    });

    return {
      ...attendance,
      isWithinGeofence: withinGeofence,
      message: withinGeofence
        ? 'Check-in recorded successfully (within geofence)'
        : 'Check-in recorded (WARNING: outside geofence radius)',
    };
  }

  async checkOut(guardId: string, dto: CheckOutDto) {
    const withinGeofence = await this.isWithinGeofence(
      dto.siteId,
      dto.latitude,
      dto.longitude,
    );

    if (dto.offlineId) {
      const existing = await this.prisma.attendance.findFirst({
        where: { offlineId: dto.offlineId },
      });
      if (existing) return existing;
    }

    const attendance = await this.prisma.attendance.create({
      data: {
        guardId,
        siteId: dto.siteId,
        deploymentId: dto.deploymentId,
        type: 'CHECK_OUT',
        latitude: dto.latitude,
        longitude: dto.longitude,
        isWithinGeofence: withinGeofence,
        syncedFromOffline: dto.syncedFromOffline || false,
        offlineId: dto.offlineId,
        timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
      },
      include: {
        site: { select: { id: true, name: true } },
      },
    });

    return {
      ...attendance,
      isWithinGeofence: withinGeofence,
      message: withinGeofence
        ? 'Check-out recorded successfully (within geofence)'
        : 'Check-out recorded (WARNING: outside geofence radius)',
    };
  }

  async syncOfflineRecords(guardId: string, dto: SyncAttendanceDto) {
    const results = [];

    for (const record of dto.records) {
      // Deduplicate by offlineId
      const existing = await this.prisma.attendance.findFirst({
        where: { offlineId: record.offlineId },
      });
      if (existing) {
        results.push({ offlineId: record.offlineId, status: 'duplicate', id: existing.id });
        continue;
      }

      const withinGeofence = await this.isWithinGeofence(
        record.siteId,
        record.latitude,
        record.longitude,
      );

      const attendance = await this.prisma.attendance.create({
        data: {
          guardId,
          siteId: record.siteId,
          deploymentId: record.deploymentId,
          type: record.type as any,
          latitude: record.latitude,
          longitude: record.longitude,
          isWithinGeofence: withinGeofence,
          syncedFromOffline: true,
          offlineId: record.offlineId,
          timestamp: new Date(record.timestamp),
        },
      });

      results.push({ offlineId: record.offlineId, status: 'synced', id: attendance.id });
    }

    return { synced: results.filter(r => r.status === 'synced').length, duplicates: results.filter(r => r.status === 'duplicate').length, results };
  }

  async findAll(filters?: {
    guardId?: string;
    siteId?: string;
    dateFrom?: string;
    dateTo?: string;
    type?: string;
  }) {
    const where: any = {};
    if (filters?.guardId) where.guardId = filters.guardId;
    if (filters?.siteId) where.siteId = filters.siteId;
    if (filters?.type) where.type = filters.type;
    if (filters?.dateFrom || filters?.dateTo) {
      where.timestamp = {};
      if (filters?.dateFrom) where.timestamp.gte = new Date(filters.dateFrom);
      if (filters?.dateTo) where.timestamp.lte = new Date(filters.dateTo);
    }

    return this.prisma.attendance.findMany({
      where,
      include: {
        guard: { select: { id: true, name: true, email: true } },
        site: { select: { id: true, name: true } },
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
  }
}
