import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // Generate daily coverage report for a given date
  async generateDailyCoverage(date: string, siteId?: string, regionId?: string) {
    const reportDate = new Date(date);
    reportDate.setHours(0, 0, 0, 0);
    const endDate = new Date(reportDate);
    endDate.setDate(endDate.getDate() + 1);

    // Build site filter
    const siteFilter: any = {};
    if (siteId) siteFilter.id = siteId;
    if (regionId) siteFilter.regionId = regionId;

    const sites = await this.prisma.site.findMany({
      where: { isActive: true, ...siteFilter },
      include: {
        posts: { where: { isActive: true } },
        deployments: {
          where: { date: { gte: reportDate, lt: endDate } },
          include: { guard: { select: { id: true, name: true, staffId: true } } },
        },
      },
    });

    let totalGuards = 0;
    let deployedGuards = 0;
    const absentGuards: any[] = [];
    const siteCoverage: any[] = [];

    for (const site of sites) {
      const requiredPerShift = site.posts.reduce((sum, p) => sum + p.guardsRequired, 0);
      const totalRequired = requiredPerShift * 2; // DAY + NIGHT
      totalGuards += totalRequired;

      const siteDeployments = site.deployments;
      const actualDeployed = siteDeployments.length;
      deployedGuards += actualDeployed;

      // Chronological records of attached officers
      const officers = siteDeployments.map((d) => ({
        guardId: d.guard.id,
        guardName: d.guard.name,
        staffId: d.guard.staffId,
        shift: d.shiftType,
        signedIn: d.signInTime,
        signedOut: d.signOutTime,
        status: d.status,
        biometricVerified: d.biometricVerified,
        withinGeofence: d.isWithinGeofence,
      }));

      const coverage = totalRequired > 0 ? Math.round((actualDeployed / totalRequired) * 100) : 0;

      siteCoverage.push({
        siteId: site.id,
        siteName: site.name,
        required: totalRequired,
        deployed: actualDeployed,
        coveragePercent: coverage,
        officers,
      });

      // Find gaps
      if (actualDeployed < totalRequired) {
        const gap = totalRequired - actualDeployed;
        for (let i = 0; i < gap; i++) {
          absentGuards.push({
            siteId: site.id,
            siteName: site.name,
            reason: 'Position not filled',
          });
        }
      }

      // Check who was scheduled but didn't show
      for (const dep of siteDeployments) {
        if (dep.status === 'SCHEDULED' && !dep.signInTime) {
          absentGuards.push({
            guardId: dep.guard.id,
            name: dep.guard.name,
            staffId: dep.guard.staffId,
            siteId: site.id,
            siteName: site.name,
            reason: 'Scheduled but did not sign in',
          });
        }
      }
    }

    const coveragePercent = totalGuards > 0 ? Math.round((deployedGuards / totalGuards) * 100) : 0;

    // Store the report
    const report = await this.prisma.deploymentReport.create({
      data: {
        reportDate,
        reportType: 'DAILY_COVERAGE',
        siteId: siteId || null,
        regionId: regionId || null,
        generatedById: 'SYSTEM',
        totalGuards,
        deployedGuards,
        coveragePercent,
        absentGuards: JSON.stringify(absentGuards),
        reportData: JSON.stringify({ siteCoverage, generatedAt: new Date().toISOString() }),
        scheduleSlot: '8AM',
        status: 'GENERATED',
      },
    });

    return {
      reportId: report.id,
      reportDate: date,
      totalGuards,
      deployedGuards,
      coveragePercent,
      absentGuards,
      siteCoverage,
    };
  }

  // Generate Night Shift report (sent at 1pm)
  async generateNightShiftReport(date: string) {
    const reportDate = new Date(date);
    reportDate.setHours(0, 0, 0, 0);
    const endDate = new Date(reportDate);
    endDate.setDate(endDate.getDate() + 1);

    const nightDeployments = await this.prisma.deployment.findMany({
      where: {
        date: { gte: reportDate, lt: endDate },
        shiftType: 'NIGHT',
      },
      include: {
        guard: { select: { id: true, name: true, staffId: true } },
        site: { select: { id: true, name: true } },
      },
    });

    const deployed = nightDeployments.length;
    const signedIn = nightDeployments.filter(d => d.signInTime).length;
    const absent = nightDeployments.filter(d => !d.signInTime && d.status === 'SCHEDULED');

    const report = await this.prisma.deploymentReport.create({
      data: {
        reportDate,
        reportType: 'NIGHT_SHIFT',
        generatedById: 'SYSTEM',
        totalGuards: deployed,
        deployedGuards: signedIn,
        coveragePercent: deployed > 0 ? Math.round((signedIn / deployed) * 100) : 0,
        absentGuards: JSON.stringify(absent.map(d => ({
          guardId: d.guard.id,
          name: d.guard.name,
          staffId: d.guard.staffId,
          siteName: d.site.name,
          reason: 'Night shift — did not sign in',
        }))),
        reportData: JSON.stringify({
          nightDeployments: nightDeployments.map(d => ({
            guardName: d.guard.name,
            staffId: d.guard.staffId,
            siteName: d.site.name,
            signedIn: !!d.signInTime,
            signInTime: d.signInTime,
            biometricVerified: d.biometricVerified,
          })),
        }),
        scheduleSlot: '1PM',
        status: 'GENERATED',
      },
    });

    return { reportId: report.id, deployed, signedIn, absentCount: absent.length };
  }

  // Get call card — overall coverage percentage
  async getCallCard(date: string) {
    const reportDate = new Date(date);
    reportDate.setHours(0, 0, 0, 0);
    const endDate = new Date(reportDate);
    endDate.setDate(endDate.getDate() + 1);

    const totalSites = await this.prisma.site.count({ where: { isActive: true } });
    const deployments = await this.prisma.deployment.findMany({
      where: { date: { gte: reportDate, lt: endDate } },
      include: { site: true, guard: { select: { name: true, staffId: true } } },
    });

    const totalPosts = await this.prisma.post.count({ where: { isActive: true } });
    const filledPosts = new Set(deployments.map(d => d.postId)).size;

    return {
      date,
      totalSites,
      totalPosts,
      filledPosts,
      totalDeployments: deployments.length,
      coveragePercent: totalPosts > 0 ? Math.round((filledPosts / totalPosts) * 100) : 0,
      activeDayShift: deployments.filter(d => d.shiftType === 'DAY').length,
      activeNightShift: deployments.filter(d => d.shiftType === 'NIGHT').length,
    };
  }

  // Get absent guards for a date
  async getAbsentGuards(date: string) {
    const reportDate = new Date(date);
    reportDate.setHours(0, 0, 0, 0);
    const endDate = new Date(reportDate);
    endDate.setDate(endDate.getDate() + 1);

    const scheduled = await this.prisma.deployment.findMany({
      where: {
        date: { gte: reportDate, lt: endDate },
        status: 'SCHEDULED',
        signInTime: null,
      },
      include: {
        guard: { select: { id: true, name: true, staffId: true, phone: true } },
        site: { select: { id: true, name: true } },
      },
    });

    return scheduled.map(d => ({
      guardId: d.guard.id,
      guardName: d.guard.name,
      staffId: d.guard.staffId,
      phone: d.guard.phone,
      siteName: d.site.name,
      shift: d.shiftType,
      status: 'DID_NOT_SIGN_IN',
    }));
  }

  // Send report to recipients (mark as sent)
  async sendReport(reportId: string, recipientIds: string[]) {
    const report = await this.prisma.deploymentReport.update({
      where: { id: reportId },
      data: {
        sentTo: JSON.stringify(recipientIds),
        sentAt: new Date(),
        status: 'SENT',
      },
    });

    // Create notifications for recipients
    for (const userId of recipientIds) {
      await this.prisma.notification.create({
        data: {
          userId,
          title: `Deployment Report — ${report.reportType.replace(/_/g, ' ')}`,
          message: `Coverage report for ${new Date(report.reportDate).toLocaleDateString()} is ready. Coverage: ${report.coveragePercent}%`,
          type: report.coveragePercent < 80 ? 'WARNING' : 'INFO',
          link: '/admin/reports',
        },
      });
    }

    return report;
  }

  // List all reports
  async getReports(type?: string, limit = 50) {
    return this.prisma.deploymentReport.findMany({
      where: type ? { reportType: type } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Get a single report
  async getReport(id: string) {
    return this.prisma.deploymentReport.findUnique({ where: { id } });
  }
}
