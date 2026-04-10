import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const todayCheckIns = await this.prisma.attendance.findMany({
      where: { type: 'CHECK_IN', timestamp: { gte: todayStart, lte: todayEnd } },
      select: { guardId: true },
    });

    const todayCheckOuts = await this.prisma.attendance.findMany({
      where: { type: 'CHECK_OUT', timestamp: { gte: todayStart, lte: todayEnd } },
      select: { guardId: true },
    });

    const checkedOutGuardIds = new Set(todayCheckOuts.map(a => a.guardId));
    const activeGuardIds = [...new Set(todayCheckIns.map(a => a.guardId))]
      .filter(id => !checkedOutGuardIds.has(id));

    const [totalGuards, totalSites, totalDeployments] = await Promise.all([
      this.prisma.user.count({ where: { role: 'GUARD', isActive: true } }),
      this.prisma.site.count({ where: { isActive: true } }),
      this.prisma.deployment.count({
        where: {
          date: { gte: todayStart, lte: todayEnd },
          status: { in: ['SCHEDULED', 'ACTIVE'] },
        },
      }),
    ]);

    const todayAttendance = await this.prisma.attendance.count({
      where: { timestamp: { gte: todayStart, lte: todayEnd } },
    });

    const todayIncidents = await this.prisma.incident.count({
      where: { createdAt: { gte: todayStart, lte: todayEnd } },
    });

    const criticalIncidents = await this.prisma.incident.count({
      where: { severity: 'CRITICAL', resolvedAt: null },
    });

    const openIncidents = await this.prisma.incident.count({
      where: { status: { in: ['OPEN', 'INVESTIGATING'] } },
    });

    const recentAttendance = await this.prisma.attendance.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        guard: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
      },
    });

    const recentIncidents = await this.prisma.incident.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        reportedBy: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
      },
    });

    const withinGeofence = await this.prisma.attendance.count({
      where: {
        timestamp: { gte: todayStart, lte: todayEnd },
        isWithinGeofence: true,
      },
    });

    // Quick stats for dashboard sparklines (last 7 days)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyAttendance = await this.prisma.attendance.findMany({
      where: { timestamp: { gte: sevenDaysAgo }, type: 'CHECK_IN' },
      select: { timestamp: true },
    });

    const weeklyTrend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      return {
        date: dateStr,
        count: weeklyAttendance.filter(a => a.timestamp.toISOString().split('T')[0] === dateStr).length,
      };
    });

    return {
      activeGuards: activeGuardIds.length,
      totalGuards,
      totalSites,
      todayDeployments: totalDeployments,
      todayAttendance,
      todayIncidents,
      criticalIncidents,
      openIncidents,
      geofenceCompliance: todayAttendance > 0
        ? Math.round((withinGeofence / todayAttendance) * 100)
        : 100,
      recentAttendance,
      recentIncidents,
      weeklyTrend,
    };
  }

  async getGuardDashboard(guardId: string) {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // Current deployment (renamed to todayDeployment for frontend compatibility)
    const todayDeployment = await this.prisma.deployment.findFirst({
      where: {
        guardId,
        date: { gte: todayStart, lte: todayEnd },
        status: { in: ['SCHEDULED', 'ACTIVE'] },
      },
      include: {
        site: true,
      },
      orderBy: { date: 'desc' },
    });

    // Today's attendance
    const todayAttendance = await this.prisma.attendance.findMany({
      where: { guardId, timestamp: { gte: todayStart, lte: todayEnd } },
      include: { site: { select: { name: true } } },
      orderBy: { timestamp: 'desc' },
    });

    // Last 7 days attendance
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentHistory = await this.prisma.attendance.findMany({
      where: { guardId, timestamp: { gte: sevenDaysAgo } },
      include: { site: { select: { name: true } } },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });

    // My incidents
    const myIncidents = await this.prisma.incident.findMany({
      where: { reportedById: guardId },
      include: { site: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Stats
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalShifts, totalCheckIns, reportedIncidents] = await Promise.all([
      this.prisma.deployment.count({ where: { guardId, date: { gte: thirtyDaysAgo } } }),
      this.prisma.attendance.count({ where: { guardId, type: 'CHECK_IN', timestamp: { gte: thirtyDaysAgo } } }),
      this.prisma.incident.count({ where: { reportedById: guardId, createdAt: { gte: thirtyDaysAgo } } }),
    ]);

    // Payroll summary for current month
    const thisMonth = now.getMonth() + 1;
    const thisYear = now.getFullYear();
    const payrollRecord = await this.prisma.payrollRecord.findFirst({
      where: { guardId, payrollMonth: thisMonth, payrollYear: thisYear },
    });

    const payrollSummary = payrollRecord
      ? {
          runningTotal: payrollRecord.totalPayrollAmount,
          shiftsWorked: payrollRecord.totalShiftsWorked,
          dailyRate: payrollRecord.dailyRate,
          netPay: payrollRecord.netPay,
          specialDutyTotal: payrollRecord.specialDutyTotal,
          status: payrollRecord.status,
        }
      : { runningTotal: 0, shiftsWorked: 0, dailyRate: 0, netPay: 0, specialDutyTotal: 0, status: 'N/A' };

    // Leave requests for this guard
    const leaveRequests = await this.prisma.leaveRequest.findMany({
      where: { guardId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Special duty invitations
    const specialDuties = await this.prisma.specialDutyPersonnel.findMany({
      where: { userId: guardId },
      include: {
        specialDuty: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      todayDeployment,
      todayAttendance,
      recentHistory,
      myIncidents,
      payrollSummary,
      leaveRequests,
      specialDuties,
      stats: {
        totalShifts,
        totalCheckIns,
        attendanceRate: totalShifts > 0 ? Math.round((totalCheckIns / totalShifts) * 100) : 0,
        reportedIncidents,
      },
    };
  }

  async getSupervisorDashboard() {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // Today's deployments with attendance status
    const todayDeployments = await this.prisma.deployment.findMany({
      where: {
        date: { gte: todayStart, lte: todayEnd },
      },
      include: {
        guard: { select: { id: true, name: true, phone: true } },
        site: { select: { id: true, name: true, latitude: true, longitude: true } },
        attendances: {
          where: { timestamp: { gte: todayStart, lte: todayEnd } },
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { shiftStart: 'asc' },
    });

    // Guards with anomalies (checked in outside geofence today)
    const anomalies = await this.prisma.attendance.findMany({
      where: {
        timestamp: { gte: todayStart, lte: todayEnd },
        isWithinGeofence: false,
      },
      include: {
        guard: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Active incidents (open + investigating)
    const activeIncidents = await this.prisma.incident.findMany({
      where: { status: { in: ['OPEN', 'INVESTIGATING'] } },
      include: {
        reportedBy: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Guard status map
    const allGuards = await this.prisma.user.findMany({
      where: { role: 'GUARD', isActive: true },
      select: { id: true, name: true, phone: true },
    });

    const todayCheckIns = await this.prisma.attendance.findMany({
      where: { type: 'CHECK_IN', timestamp: { gte: todayStart, lte: todayEnd } },
      select: { guardId: true },
    });

    const todayCheckOuts = await this.prisma.attendance.findMany({
      where: { type: 'CHECK_OUT', timestamp: { gte: todayStart, lte: todayEnd } },
      select: { guardId: true },
    });

    const checkedInIds = new Set(todayCheckIns.map(a => a.guardId));
    const checkedOutIds = new Set(todayCheckOuts.map(a => a.guardId));
    const deployedIds = new Set(todayDeployments.map(d => d.guardId));

    const guardStatuses = allGuards.map(g => ({
      ...g,
      status: checkedInIds.has(g.id) && !checkedOutIds.has(g.id)
        ? 'ON_DUTY'
        : checkedOutIds.has(g.id)
          ? 'OFF_DUTY'
          : deployedIds.has(g.id)
            ? 'PENDING'
            : 'UNASSIGNED',
    }));

    return {
      todayDeployments,
      anomalies,
      activeIncidents,
      guardStatuses,
      summary: {
        totalDeployed: todayDeployments.length,
        onDuty: guardStatuses.filter(g => g.status === 'ON_DUTY').length,
        pending: guardStatuses.filter(g => g.status === 'PENDING').length,
        anomalyCount: anomalies.length,
        activeIncidentCount: activeIncidents.length,
      },
    };
  }

  async getClientDashboard(clientId: string) {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get client's sites
    const clientSites = await this.prisma.clientSite.findMany({
      where: { clientId },
      include: {
        site: {
          include: {
            deployments: {
              where: { date: { gte: todayStart, lte: todayEnd } },
              include: {
                guard: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    const siteIds = clientSites.map(cs => cs.siteId);

    // Attendance for client's sites
    const recentAttendance = await this.prisma.attendance.findMany({
      where: { siteId: { in: siteIds }, timestamp: { gte: todayStart, lte: todayEnd } },
      include: {
        guard: { select: { name: true } },
        site: { select: { name: true } },
      },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });

    // Incidents at client's sites
    const recentIncidents = await this.prisma.incident.findMany({
      where: { siteId: { in: siteIds } },
      include: {
        reportedBy: { select: { name: true } },
        site: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    // Monthly stats
    const [monthlyAttendance, monthlyIncidents, activeGuards] = await Promise.all([
      this.prisma.attendance.count({
        where: { siteId: { in: siteIds }, timestamp: { gte: thirtyDaysAgo }, type: 'CHECK_IN' },
      }),
      this.prisma.incident.count({
        where: { siteId: { in: siteIds }, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.deployment.findMany({
        where: { siteId: { in: siteIds }, date: { gte: todayStart, lte: todayEnd } },
        select: { guardId: true },
        distinct: ['guardId'],
      }),
    ]);

    const withinGeofence = await this.prisma.attendance.count({
      where: { siteId: { in: siteIds }, timestamp: { gte: thirtyDaysAgo }, isWithinGeofence: true },
    });

    const totalMonthlyAtt = await this.prisma.attendance.count({
      where: { siteId: { in: siteIds }, timestamp: { gte: thirtyDaysAgo } },
    });

    const invoices = await this.prisma.invoice.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      sites: clientSites.map(cs => cs.site),
      recentAttendance,
      recentIncidents,
      invoices,
      stats: {
        totalSites: siteIds.length,
        activeGuardsToday: activeGuards.length,
        monthlyCheckIns: monthlyAttendance,
        monthlyIncidents,
        geofenceCompliance: totalMonthlyAtt > 0 ? Math.round((withinGeofence / totalMonthlyAtt) * 100) : 100,
      },
    };
  }
}
