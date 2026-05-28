import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getAttendanceTrend(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const records = await this.prisma.spotCheck.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, checkInTime: true, checkOutTime: true, isPresent: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dailyMap = new Map<string, { checkIns: number; checkOuts: number; withinGeofence: number; total: number }>();

    for (let i = 0; i <= days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dailyMap.set(key, { checkIns: 0, checkOuts: 0, withinGeofence: 0, total: 0 });
    }

    for (const r of records) {
      const key = r.createdAt.toISOString().split('T')[0];
      const entry = dailyMap.get(key);
      if (entry) {
        entry.total++;
        if (r.checkInTime) entry.checkIns++;
        if (r.checkOutTime) entry.checkOuts++;
        if (r.isPresent) entry.withinGeofence++; // Assuming presence equates to compliance for now
      }
    }

    return Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      ...data,
      compliance: data.total > 0 ? Math.round((data.withinGeofence / data.total) * 100) : 100,
    }));
  }

  async getIncidentTrend(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const records = await this.prisma.incident.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, severity: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    const dailyMap = new Map<string, { total: number; low: number; medium: number; high: number; critical: number }>();

    for (let i = 0; i <= days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dailyMap.set(key, { total: 0, low: 0, medium: 0, high: 0, critical: 0 });
    }

    for (const r of records) {
      const key = r.createdAt.toISOString().split('T')[0];
      const entry = dailyMap.get(key);
      if (entry) {
        entry.total++;
        const sev = r.severity.toLowerCase() as 'low' | 'medium' | 'high' | 'critical';
        if (entry[sev] !== undefined) entry[sev]++;
      }
    }

    return Array.from(dailyMap.entries()).map(([date, data]) => ({ date, ...data }));
  }

  async getGuardPerformance() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const guards = await this.prisma.user.findMany({
      where: { role: 'GUARD', isActive: true },
      select: { id: true, name: true, email: true, phone: true },
    });

    const result = [];

    for (const guard of guards) {
      const [totalDeployments, totalCheckIns, withinGeofence, incidentsReported] = await Promise.all([
        this.prisma.deployment.count({
          where: { guardId: guard.id, date: { gte: thirtyDaysAgo } },
        }),
        this.prisma.spotCheck.count({
          where: { guardId: guard.id, createdAt: { gte: thirtyDaysAgo }, checkInTime: { not: null } },
        }),
        this.prisma.spotCheck.count({
          where: { guardId: guard.id, createdAt: { gte: thirtyDaysAgo }, checkInTime: { not: null } },
        }),
        this.prisma.incident.count({
          where: { reportedById: guard.id, createdAt: { gte: thirtyDaysAgo } },
        }),
      ]);

      result.push({
        ...guard,
        totalDeployments,
        totalCheckIns,
        attendanceRate: totalDeployments > 0 ? Math.round((totalCheckIns / totalDeployments) * 100) : 0,
        geofenceCompliance: totalCheckIns > 0 ? Math.round((withinGeofence / totalCheckIns) * 100) : 100,
        incidentsReported,
      });
    }

    return result.sort((a, b) => b.attendanceRate - a.attendanceRate);
  }

  async getSiteSummary() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sites = await this.prisma.site.findMany({
      where: { isActive: true },
      select: { id: true, name: true, address: true },
    });

    const result = [];

    for (const site of sites) {
      const [totalDeployments, totalAttendance, totalIncidents, unresolvedIncidents] = await Promise.all([
        this.prisma.deployment.count({
          where: { siteId: site.id, date: { gte: thirtyDaysAgo } },
        }),
        this.prisma.spotCheck.count({
          where: { siteId: site.id, createdAt: { gte: thirtyDaysAgo }, checkInTime: { not: null } },
        }),
        this.prisma.incident.count({
          where: { siteId: site.id, createdAt: { gte: thirtyDaysAgo } },
        }),
        this.prisma.incident.count({
          where: { siteId: site.id, status: { in: ['OPEN', 'INVESTIGATING'] } },
        }),
      ]);

      result.push({
        ...site,
        totalDeployments,
        totalAttendance,
        totalIncidents,
        unresolvedIncidents,
      });
    }

    return result;
  }

  async exportData(type: string, startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    if (type === 'attendance') {
      return this.prisma.spotCheck.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: {
          guard: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (type === 'incidents') {
      return this.prisma.incident.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: {
          reportedBy: { select: { name: true, email: true } },
          site: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (type === 'deployments') {
      return this.prisma.deployment.findMany({
        where: { date: { gte: start, lte: end } },
        include: {
          guard: { select: { name: true, email: true } },
          site: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
      });
    }

    return [];
  }
}
