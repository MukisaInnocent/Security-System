const fs = require('fs');
const path = require('path');

// 1. Add site relation to SpotCheck in schema.prisma
const schemaPath = path.join(__dirname, 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');
if (!schema.includes('site       Site?         @relation(fields: [siteId], references: [id])')) {
    schema = schema.replace(
        '  deployment  Deployment    @relation(fields: [deploymentId], references: [id])\n',
        '  deployment  Deployment    @relation(fields: [deploymentId], references: [id])\n  site       Site?         @relation(fields: [siteId], references: [id])\n'
    );
    // Also add spotChecks to Site model
    if (!schema.includes('spotChecks        SpotCheck[]')) {
        schema = schema.replace(
            '  primaryGuards     GuardProfile[]     @relation("PrimaryGuardSite")\n',
            '  primaryGuards     GuardProfile[]     @relation("PrimaryGuardSite")\n  spotChecks        SpotCheck[]\n'
        );
    }
    fs.writeFileSync(schemaPath, schema);
}

// 2. Fix analytics.service.ts
const analyticsPath = path.join(__dirname, 'src', 'analytics', 'analytics.service.ts');
let analyticsContent = fs.readFileSync(analyticsPath, 'utf8');
analyticsContent = analyticsContent.replace(
    /where: { guardId: guard\.id, createdAt: { gte: thirtyDaysAgo }, checkInTime: { not: null } },/g,
    (match, offset, str) => {
        // If we are inside getSiteSummary, replace with siteId: site.id
        // A simple way is to check the surrounding context, or just replace the second occurrence
        return match;
    }
);
// Actually, let's just use string replace on the exact bad lines
analyticsContent = analyticsContent.replace(
    `        this.prisma.spotCheck.count({
          where: { guardId: guard.id, createdAt: { gte: thirtyDaysAgo }, checkInTime: { not: null } },
        }),
        this.prisma.incident.count({
          where: { siteId: site.id, createdAt: { gte: thirtyDaysAgo } },
        }),`,
    `        this.prisma.spotCheck.count({
          where: { siteId: site.id, createdAt: { gte: thirtyDaysAgo }, checkInTime: { not: null } },
        }),
        this.prisma.incident.count({
          where: { siteId: site.id, createdAt: { gte: thirtyDaysAgo } },
        }),`
);
fs.writeFileSync(analyticsPath, analyticsContent);

// 3. Fix dashboard.service.ts
const dashPath = path.join(__dirname, 'src', 'dashboard', 'dashboard.service.ts');
let dashContent = fs.readFileSync(dashPath, 'utf8');
// Fix leftover `type: 'CHECK_IN'`
dashContent = dashContent.replace(/type: 'CHECK_IN'/g, "checkInTime: { not: null }");
dashContent = dashContent.replace(/type: 'CHECK_OUT'/g, "checkOutTime: { not: null }");

// Also there was an error about 'type' in `SpotCheckWhereInput`. This will fix it.
fs.writeFileSync(dashPath, dashContent);

console.log('Fixed schema and TS errors');
