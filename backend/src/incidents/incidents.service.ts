import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentDto, SyncIncidentsDto } from './dto/incident.dto';

@Injectable()
export class IncidentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateIncidentDto, mediaUrl?: string) {
    if (dto.offlineId) {
      const existing = await this.prisma.incident.findFirst({
        where: { offlineId: dto.offlineId },
      });
      if (existing) return existing;
    }

    const incident = await this.prisma.incident.create({
      data: {
        reportedById: userId,
        siteId: dto.siteId,
        description: dto.description,
        severity: (dto.severity as any) || 'LOW',
        status: 'OPEN',
        latitude: dto.latitude,
        longitude: dto.longitude,
        mediaUrl,
        syncedFromOffline: dto.syncedFromOffline || false,
        offlineId: dto.offlineId,
        createdAt: dto.timestamp ? new Date(dto.timestamp) : new Date(),
      },
      include: {
        reportedBy: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entity: 'Incident',
        entityId: incident.id,
        metadata: JSON.stringify({ severity: incident.severity, site: incident.site.name }),
      },
    });

    return incident;
  }

  async findAll(filters?: { siteId?: string; severity?: string; status?: string; dateFrom?: string; dateTo?: string }) {
    const where: any = {};
    if (filters?.siteId) where.siteId = filters.siteId;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.status) where.status = filters.status;
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters?.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters?.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    return this.prisma.incident.findMany({
      where,
      include: {
        reportedBy: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async findOne(id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        reportedBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        resolvedBy: { select: { id: true, name: true, email: true } },
        site: true,
      },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }

  async assignIncident(id: string, assignedToId: string, userId: string) {
    const incident = await this.prisma.incident.update({
      where: { id },
      data: {
        assignedToId,
        status: 'INVESTIGATING',
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        site: { select: { name: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Incident',
        entityId: id,
        metadata: JSON.stringify({ action: 'assigned', assignedTo: incident.assignedTo?.name }),
      },
    });

    return incident;
  }

  async resolveIncident(id: string, resolvedById: string, resolutionNote: string) {
    const incident = await this.prisma.incident.update({
      where: { id },
      data: {
        resolvedById,
        resolutionNote,
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
      include: {
        resolvedBy: { select: { id: true, name: true } },
        site: { select: { name: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: resolvedById,
        action: 'UPDATE',
        entity: 'Incident',
        entityId: id,
        metadata: JSON.stringify({ action: 'resolved', note: resolutionNote }),
      },
    });

    return incident;
  }

  async updateStatus(id: string, status: string, userId: string) {
    const incident = await this.prisma.incident.update({
      where: { id },
      data: { status },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Incident',
        entityId: id,
        metadata: JSON.stringify({ action: 'status_change', status }),
      },
    });

    return incident;
  }

  async syncOfflineRecords(userId: string, dto: SyncIncidentsDto) {
    const results = [];

    for (const record of dto.records) {
      const existing = await this.prisma.incident.findFirst({
        where: { offlineId: record.offlineId },
      });
      if (existing) {
        results.push({ offlineId: record.offlineId, status: 'duplicate', id: existing.id });
        continue;
      }

      const incident = await this.prisma.incident.create({
        data: {
          reportedById: userId,
          siteId: record.siteId,
          description: record.description,
          severity: (record.severity as any) || 'LOW',
          status: 'OPEN',
          latitude: record.latitude,
          longitude: record.longitude,
          syncedFromOffline: true,
          offlineId: record.offlineId,
          createdAt: new Date(record.timestamp),
        },
      });

      results.push({ offlineId: record.offlineId, status: 'synced', id: incident.id });
    }

    return {
      synced: results.filter(r => r.status === 'synced').length,
      duplicates: results.filter(r => r.status === 'duplicate').length,
      results,
    };
  }
}
