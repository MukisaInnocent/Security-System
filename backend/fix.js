const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(filePath, content);
}

// 1. analytics.service.ts
const analyticsPath = path.join(__dirname, 'src', 'analytics', 'analytics.service.ts');
let analyticsContent = fs.readFileSync(analyticsPath, 'utf8');

// replace attendance.findMany in getAttendanceTrend
analyticsContent = analyticsContent.replace(
    /const records = await this\.prisma\.attendance\.findMany\([\s\S]*?\}\);/g,
    `const records = await this.prisma.spotCheck.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, checkInTime: true, checkOutTime: true, isPresent: true },
      orderBy: { createdAt: 'asc' },
    });`
);

// replace loop logic in getAttendanceTrend
analyticsContent = analyticsContent.replace(
    /for \(const r of records\) {[\s\S]*?}/,
    `for (const r of records) {
      const key = r.createdAt.toISOString().split('T')[0];
      const entry = dailyMap.get(key);
      if (entry) {
        entry.total++;
        if (r.checkInTime) entry.checkIns++;
        if (r.checkOutTime) entry.checkOuts++;
        if (r.isPresent) entry.withinGeofence++; // Assuming presence equates to compliance for now
      }
    }`
);

// getGuardPerformance
analyticsContent = analyticsContent.replace(
    /this\.prisma\.attendance\.count\([\s\S]*?\}\),/g,
    `this.prisma.spotCheck.count({
          where: { guardId: guard.id, createdAt: { gte: thirtyDaysAgo }, checkInTime: { not: null } },
        }),`
);
// wait, getGuardPerformance had 2 attendance count calls.
// Let's replace the block
analyticsContent = analyticsContent.replace(
    /this\.prisma\.attendance\.count\({[\s\S]*?timestamp: { gte: thirtyDaysAgo } },[\s\S]*?\}\),[\s\S]*?this\.prisma\.attendance\.count\({[\s\S]*?isWithinGeofence: true },[\s\S]*?\}\),/g,
    `this.prisma.spotCheck.count({
          where: { guardId: guard.id, createdAt: { gte: thirtyDaysAgo }, checkInTime: { not: null } },
        }),
        this.prisma.spotCheck.count({
          where: { guardId: guard.id, createdAt: { gte: thirtyDaysAgo }, isPresent: true },
        }),`
);

// getSiteSummary
analyticsContent = analyticsContent.replace(
    /this\.prisma\.attendance\.count\({[\s\S]*?where: { siteId: site\.id, timestamp: { gte: thirtyDaysAgo } },[\s\S]*?}\),/g,
    `this.prisma.spotCheck.count({
          where: { siteId: site.id, createdAt: { gte: thirtyDaysAgo } },
        }),`
);

// exportData
analyticsContent = analyticsContent.replace(
    /this\.prisma\.attendance\.findMany\({[\s\S]*?timestamp: { gte: start, lte: end } },[\s\S]*?timestamp: 'desc' },/g,
    `this.prisma.spotCheck.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: {
          guard: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },`
);

fs.writeFileSync(analyticsPath, analyticsContent);

// 2. dashboard.service.ts
const dashPath = path.join(__dirname, 'src', 'dashboard', 'dashboard.service.ts');
let dashContent = fs.readFileSync(dashPath, 'utf8');

dashContent = dashContent.replace(/this\.prisma\.attendance/g, 'this.prisma.spotCheck');
dashContent = dashContent.replace(/type: 'CHECK_IN', timestamp/g, 'checkInTime: { not: null }, createdAt');
dashContent = dashContent.replace(/type: 'CHECK_OUT', timestamp/g, 'checkOutTime: { not: null }, createdAt');
dashContent = dashContent.replace(/timestamp:/g, 'createdAt:');
dashContent = dashContent.replace(/a\.timestamp\.toISOString/g, 'a.createdAt.toISOString');
dashContent = dashContent.replace(/isWithinGeofence/g, 'isPresent');
dashContent = dashContent.replace(/attendances: {/g, 'spotChecks: {');
dashContent = dashContent.replace(/attendances:/g, 'spotChecks:');

fs.writeFileSync(dashPath, dashContent);

console.log('Fixed analytics and dashboard');
