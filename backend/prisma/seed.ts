import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding DDBMS v1.4...\n');
  const hash = (pw: string) => bcrypt.hash(pw, 10);

  // Clean all data
  await prisma.mealVerification.deleteMany();
  await prisma.mealDelivery.deleteMany();
  await prisma.foodSupplierSite.deleteMany();
  await prisma.foodSupplierAccount.deleteMany();
  await prisma.deploymentVoid.deleteMany();
  await prisma.guardCharge.deleteMany();
  await prisma.spotCheck.deleteMany();
  await prisma.payrollRecord.deleteMany();
  await prisma.specialDutyPersonnel.deleteMany();
  await prisma.specialDuty.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.contractSite.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.siteInventory.deleteMany();
  await prisma.assetDistribution.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.purchaseRequest.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.ammunitionStock.deleteMany();
  await prisma.weaponIssuance.deleteMany();
  await prisma.weaponRecord.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.guardProfile.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.clientSite.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.deployment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.site.deleteMany();
  await prisma.user.deleteMany();
  await prisma.region.deleteMany();
  await prisma.tenant.deleteMany();

  // === TENANT ===
  const tenant = await prisma.tenant.create({
    data: { name: 'SecureGuard Operations Ltd', code: 'SGO-001', currency: 'UGX' },
  });
  console.log(`✅ Tenant: ${tenant.name}`);

  // === USERS ===
  const adminPw = await hash('admin123');
  const admin = await prisma.user.create({
    data: { email: 'admin@security.com', password: adminPw, name: 'System Admin', phone: '+256700100100', role: 'ADMIN', tenantId: tenant.id, staffId: 'SGO-ADM-001' },
  });
  const ceo = await prisma.user.create({
    data: { email: 'ceo@security.com', password: await hash('ceo123'), name: 'Robert Nkwanzi', phone: '+256700100099', role: 'CEO', tenantId: tenant.id, staffId: 'SGO-CEO-001' },
  });
  const opsManager = await prisma.user.create({
    data: { email: 'ops@security.com', password: await hash('ops123'), name: 'James Mukasa', phone: '+256700100101', role: 'OPS_MANAGER', tenantId: tenant.id, staffId: 'SGO-OPS-001' },
  });
  const regional = await prisma.user.create({
    data: { email: 'regional@security.com', password: await hash('regional123'), name: 'Patricia Auma', phone: '+256700100105', role: 'REGIONAL_MANAGER', tenantId: tenant.id, staffId: 'SGO-REG-001' },
  });
  const hr = await prisma.user.create({
    data: { email: 'hr@security.com', password: await hash('hr123'), name: 'Sarah Nakato', phone: '+256700100106', role: 'HR', tenantId: tenant.id, staffId: 'SGO-HR-001' },
  });
  const finance = await prisma.user.create({
    data: { email: 'finance@security.com', password: await hash('finance123'), name: 'David Ssemakula', phone: '+256700100107', role: 'FINANCE', tenantId: tenant.id, staffId: 'SGO-FIN-001' },
  });
  const armoury = await prisma.user.create({
    data: { email: 'armoury@security.com', password: await hash('armoury123'), name: 'Moses Opio', phone: '+256700100108', role: 'ARMOURY_OFFICER', tenantId: tenant.id, staffId: 'SGO-ARM-001' },
  });
  const procurement = await prisma.user.create({
    data: { email: 'procurement@security.com', password: await hash('proc123'), name: 'Grace Achieng', phone: '+256700100109', role: 'PROCUREMENT_OFFICER', tenantId: tenant.id, staffId: 'SGO-PRO-001' },
  });
  const logistics = await prisma.user.create({
    data: { email: 'logistics@security.com', password: await hash('log123'), name: 'Peter Otim', phone: '+256700100110', role: 'LOGISTICS_OFFICER', tenantId: tenant.id, staffId: 'SGO-LOG-001' },
  });
  const supervisor = await prisma.user.create({
    data: { email: 'supervisor@security.com', password: await hash('sup123'), name: 'Grace Namutebi', phone: '+256700100102', role: 'SUPERVISOR', tenantId: tenant.id, staffId: 'SGO-SUP-001' },
  });
  const supervisor2 = await prisma.user.create({
    data: { email: 'supervisor2@security.com', password: await hash('sup123'), name: 'Amos Wamala', phone: '+256700100103', role: 'SUPERVISOR', tenantId: tenant.id, staffId: 'SGO-SUP-002' },
  });
  const analyst = await prisma.user.create({
    data: { email: 'analyst@security.com', password: await hash('analyst123'), name: 'Michael Onen', phone: '+256700100104', role: 'M_AND_E', tenantId: tenant.id, staffId: 'SGO-ANL-001' },
  });

  const guardData = [
    { name: 'John Okello',    email: 'guard1@security.com', phone: '+256701001001', staffId: 'SGO-GRD-001', weaponAuth: true },
    { name: 'Sarah Nambi',    email: 'guard2@security.com', phone: '+256701001002', staffId: 'SGO-GRD-002', weaponAuth: false },
    { name: 'Peter Ochen',    email: 'guard3@security.com', phone: '+256701001003', staffId: 'SGO-GRD-003', weaponAuth: true },
    { name: 'Rose Atim',      email: 'guard4@security.com', phone: '+256701001004', staffId: 'SGO-GRD-004', weaponAuth: false },
    { name: 'Moses Kato',     email: 'guard5@security.com', phone: '+256701001005', staffId: 'SGO-GRD-005', weaponAuth: true },
    { name: 'Faith Nantongo', email: 'guard6@security.com', phone: '+256701001006', staffId: 'SGO-GRD-006', weaponAuth: false },
    { name: 'Robert Ssali',   email: 'guard7@security.com', phone: '+256701001007', staffId: 'SGO-GRD-007', weaponAuth: true },
    { name: 'Agnes Nabirye',  email: 'guard8@security.com', phone: '+256701001008', staffId: 'SGO-GRD-008', weaponAuth: false },
  ];

  const guardPw = await hash('guard123');
  const pinHash = await hash('1234');
  const guards: any[] = [];
  for (const g of guardData) {
    const guard = await prisma.user.create({
      data: { email: g.email, password: guardPw, name: g.name, phone: g.phone, role: 'GUARD', tenantId: tenant.id, staffId: g.staffId },
    });
    await prisma.guardProfile.create({
      data: {
        userId: guard.id, weaponAuthorised: g.weaponAuth, biometricEnrolled: true, biometricPin: pinHash,
        monthlySalary: 200000, salaryEffectiveDate: new Date('2026-01-01'),
      },
    });
    guards.push(guard);
  }
  await prisma.guardProfile.create({
    data: { userId: supervisor.id, weaponAuthorised: true, biometricEnrolled: true, biometricPin: pinHash, monthlySalary: 350000 },
  });

  const client = await prisma.user.create({
    data: { email: 'client@company.com', password: await hash('client123'), name: 'ABC Corporation', phone: '+256700200200', role: 'CLIENT', tenantId: tenant.id },
  });
  const client2 = await prisma.user.create({
    data: { email: 'client2@company.com', password: await hash('client123'), name: 'XYZ Industries', phone: '+256700200201', role: 'CLIENT', tenantId: tenant.id },
  });
  const foodUser = await prisma.user.create({
    data: { email: 'food@supplier.com', password: await hash('food123'), name: 'Mama Rosa Catering', phone: '+256700300300', role: 'FOOD_SUPPLIER', tenantId: tenant.id },
  });
  console.log(`✅ 20 users created (all roles)`);

  // === REGIONS ===
  const region1 = await prisma.region.create({
    data: { name: 'Central Region', description: 'Kampala and surrounding areas', tenantId: tenant.id, managerId: regional.id },
  });
  const region2 = await prisma.region.create({
    data: { name: 'Northern Region', description: 'Gulu and Lira districts', tenantId: tenant.id },
  });
  console.log(`✅ Regions created`);

  // === SITES ===
  const siteData = [
    { name: 'ABC Corp Headquarters', address: '123 Business Ave, Kampala', lat: 0.3476, lng: 32.5825, radius: 150, regionId: region1.id },
    { name: 'Industrial Park Warehouse', address: '45 Industrial Rd, Kampala', lat: 0.3136, lng: 32.5811, radius: 200, regionId: region1.id },
    { name: 'Shoprite Lugogo', address: 'Lugogo Mall, Kampala', lat: 0.3301, lng: 32.6002, radius: 120, regionId: region1.id },
    { name: 'Acacia Mall', address: 'Acacia Ave, Kampala', lat: 0.3220, lng: 32.5920, radius: 100, regionId: region1.id },
    { name: 'XYZ Industries Factory', address: '88 Jinja Road, Kampala', lat: 0.3180, lng: 32.6050, radius: 250, regionId: region1.id },
    { name: 'Nakasero Hospital', address: '14 Hospital Rd, Kampala', lat: 0.3150, lng: 32.5780, radius: 130, regionId: region2.id },
  ];

  const sites: any[] = [];
  for (const s of siteData) {
    const site = await prisma.site.create({
      data: { name: s.name, address: s.address, latitude: s.lat, longitude: s.lng, geofenceRadius: s.radius, tenantId: tenant.id, regionId: s.regionId },
    });
    sites.push(site);
  }
  console.log(`✅ ${sites.length} sites created`);

  // === POSTS ===
  const postTemplates = [
    { name: 'Main Entrance', shiftType: 'BOTH', weaponRequired: true, guardsRequired: 1 },
    { name: 'Vehicle Gate', shiftType: 'BOTH', weaponRequired: true, guardsRequired: 1 },
    { name: 'Control Room', shiftType: 'BOTH', weaponRequired: false, guardsRequired: 1 },
    { name: 'Perimeter Patrol', shiftType: 'NIGHT', weaponRequired: true, guardsRequired: 1 },
  ];
  const posts: any[] = [];
  for (const site of sites) {
    for (const pt of postTemplates.slice(0, 3)) {
      const post = await prisma.post.create({
        data: { name: pt.name, siteId: site.id, shiftType: pt.shiftType, guardsRequired: pt.guardsRequired, weaponRequired: pt.weaponRequired },
      });
      posts.push(post);
    }
  }
  console.log(`✅ ${posts.length} posts created`);

  // === CLIENT-SITE ASSOCIATIONS ===
  await prisma.clientSite.create({ data: { clientId: client.id, siteId: sites[0].id } });
  await prisma.clientSite.create({ data: { clientId: client.id, siteId: sites[1].id } });
  await prisma.clientSite.create({ data: { clientId: client2.id, siteId: sites[4].id } });

  // === WEAPONS ===
  const weaponData = [
    { serialNumber: 'UPF-001-2024', weaponType: 'PISTOL', make: 'Beretta', model: 'M9', licenceNumber: 'LIC-001', licenceExpiry: new Date('2027-01-01') },
    { serialNumber: 'UPF-002-2024', weaponType: 'PISTOL', make: 'Glock', model: 'G17', licenceNumber: 'LIC-002', licenceExpiry: new Date('2027-06-01') },
    { serialNumber: 'UPF-003-2024', weaponType: 'SHOTGUN', make: 'Mossberg', model: '500', licenceNumber: 'LIC-003', licenceExpiry: new Date('2026-12-01') },
    { serialNumber: 'UPF-004-2024', weaponType: 'PISTOL', make: 'Beretta', model: 'M9', licenceNumber: 'LIC-004', licenceExpiry: new Date('2027-03-01') },
    { serialNumber: 'UPF-005-2024', weaponType: 'RIFLE', make: 'AK', model: 'AK-47', licenceNumber: 'LIC-005', licenceExpiry: new Date('2025-12-31') }, // Expiring
  ];
  const weapons: any[] = [];
  for (const w of weaponData) {
    const weapon = await prisma.weaponRecord.create({
      data: { ...w, primarySiteId: sites[0].id },
    });
    weapons.push(weapon);
  }
  console.log(`✅ ${weapons.length} weapons registered`);

  // === AMMUNITION ===
  await prisma.ammunitionStock.create({ data: { siteId: sites[0].id, calibre: '9mm', type: 'BALL', quantity: 250, minStock: 50 } });
  await prisma.ammunitionStock.create({ data: { siteId: sites[0].id, calibre: '12gauge', type: 'BUCKSHOT', quantity: 100, minStock: 30 } });
  await prisma.ammunitionStock.create({ data: { siteId: sites[1].id, calibre: '9mm', type: 'BALL', quantity: 180, minStock: 50 } });

  // === SUPPLIERS ===
  const supplier1 = await prisma.supplier.create({
    data: { name: 'Kampala Security Supplies Ltd', contactName: 'John Byamugisha', contactPhone: '+256700400001', contactEmail: 'supplies@kss.ug', categories: JSON.stringify(['uniforms','equipment']), performanceRating: 4.5 },
  });
  const supplier2 = await prisma.supplier.create({
    data: { name: 'Uganda Firearms & Ammo Co', contactName: 'Peter Mugisha', contactPhone: '+256700400002', categories: JSON.stringify(['ammunition','weapons']), performanceRating: 4.8 },
  });
  const supplier3 = await prisma.supplier.create({
    data: { name: 'TechComm Radio Systems', contactName: 'Alice Nsubuga', contactPhone: '+256700400003', categories: JSON.stringify(['radios','communication']), performanceRating: 4.2 },
  });
  console.log(`✅ Suppliers created`);

  // === PURCHASE REQUESTS & ORDERS ===
  const pr1 = await prisma.purchaseRequest.create({
    data: { requestedById: armoury.id, department: 'ARMOURY', itemDescription: '9mm Ball Ammunition x500 rounds', quantity: 500, urgencyLevel: 'HIGH', status: 'APPROVED' },
  });
  const pr2 = await prisma.purchaseRequest.create({
    data: { requestedById: hr.id, department: 'HR', itemDescription: 'Guard Uniforms (shirt+trouser sets)', quantity: 20, urgencyLevel: 'NORMAL', status: 'PENDING' },
  });
  const po1 = await prisma.purchaseOrder.create({
    data: {
      supplierId: supplier2.id, totalAmount: 2500000, status: 'DELIVERED', deliveredDate: new Date(),
      orderItems: { create: [{ description: '9mm Ball Ammo 500 rounds', quantity: 500, unitPrice: 5000, totalPrice: 2500000 }] },
    },
  });
  console.log(`✅ Purchase requests and orders created`);

  // === SITE INVENTORY ===
  const inventoryItems = [
    { equipmentType: 'RADIO', itemDescription: 'Motorola XT Series', quantity: 4, minThreshold: 2 },
    { equipmentType: 'UNIFORM', itemDescription: 'Guard Shirt Size L', quantity: 8, minThreshold: 3 },
    { equipmentType: 'TORCH', itemDescription: 'LED Patrol Torch', quantity: 6, minThreshold: 2 },
  ];
  for (const site of sites.slice(0, 3)) {
    for (const item of inventoryItems) {
      await prisma.siteInventory.create({ data: { siteId: site.id, ...item } });
    }
  }
  // One low-stock alert case
  await prisma.siteInventory.create({ data: { siteId: sites[3].id, equipmentType: 'RADIO', itemDescription: 'Motorola XT Series', quantity: 1, minThreshold: 2 } });
  console.log(`✅ Site inventory seeded`);

  // === CONTRACTS ===
  const contract1 = await prisma.contract.create({
    data: {
      clientId: client.id, requiredGuardsPerShift: 3, requiredShifts: 'BOTH', billingRate: 50000,
      billingCycle: 'MONTHLY', startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), status: 'ACTIVE',
      contractSites: { create: [{ siteId: sites[0].id }, { siteId: sites[1].id }] },
    },
  });
  const contract2 = await prisma.contract.create({
    data: {
      clientId: client2.id, requiredGuardsPerShift: 2, requiredShifts: 'NIGHT', billingRate: 45000,
      billingCycle: 'MONTHLY', startDate: new Date('2026-02-01'), endDate: new Date('2026-05-01'), status: 'EXPIRING',
      contractSites: { create: [{ siteId: sites[4].id }] },
    },
  });
  console.log(`✅ Contracts created`);

  // === HISTORICAL DATA (30 days) ===
  const now = new Date();
  let totalDep = 0, totalAtt = 0, totalInc = 0;
  const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const categories = ['TRESPASS', 'THEFT', 'MEDICAL', 'SUSPICIOUS_ACTIVITY', 'OTHER'];
  const incidentDescs = [
    'Suspicious vehicle parked near entrance', 'Unauthorized person attempted entry',
    'Fire alarm triggered - false alarm', 'Broken window discovered on 2nd floor',
    'Power outage in sector B', 'Water leak in basement area',
    'Lost and found item reported', 'Delivery truck arrived after hours',
  ];

  for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(0, 0, 0, 0);

    const dayShifts = [
      { guardIdx: 0, siteIdx: 0, postIdx: 0, start: '07:00', end: '17:30', shiftType: 'DAY' },
      { guardIdx: 1, siteIdx: 1, postIdx: 3, start: '07:00', end: '17:30', shiftType: 'DAY' },
      { guardIdx: 2, siteIdx: 2, postIdx: 6, start: '07:00', end: '17:30', shiftType: 'DAY' },
      { guardIdx: 3, siteIdx: 3, postIdx: 9, start: '07:00', end: '17:30', shiftType: 'DAY' },
      { guardIdx: 4, siteIdx: 0, postIdx: 1, start: '17:30', end: '07:00', shiftType: 'NIGHT' },
      { guardIdx: 5, siteIdx: 1, postIdx: 4, start: '17:30', end: '07:00', shiftType: 'NIGHT' },
      { guardIdx: 6, siteIdx: 4, postIdx: 0, start: '07:00', end: '17:30', shiftType: 'DAY' },
      { guardIdx: 7, siteIdx: 5, postIdx: 0, start: '07:00', end: '17:30', shiftType: 'DAY' },
    ];

    for (const shift of dayShifts) {
      const isToday = daysAgo === 0;
      const willComplete = !isToday && Math.random() > 0.05;
      const status = isToday ? 'ACTIVE' : willComplete ? 'COMPLETED' : 'SCHEDULED';

      const signInTime = new Date(date);
      const [sh] = shift.start.split(':').map(Number);
      signInTime.setHours(sh, Math.floor(Math.random() * 10), 0, 0);

      const deployment = await prisma.deployment.create({
        data: {
          guardId: guards[shift.guardIdx].id,
          siteId: sites[shift.siteIdx].id,
          postId: posts[Math.min(shift.postIdx, posts.length - 1)]?.id,
          supervisorId: supervisor.id,
          shiftStart: shift.start,
          shiftEnd: shift.end,
          shiftType: shift.shiftType,
          date,
          status,
          biometricVerified: willComplete || isToday,
          signInTime: willComplete || isToday ? signInTime : null,
          gpsLatIn: sites[shift.siteIdx].latitude,
          gpsLngIn: sites[shift.siteIdx].longitude,
          isWithinGeofence: Math.random() > 0.08,
        },
      });
      totalDep++;

      if (willComplete && daysAgo > 0) {
        const [eh] = shift.end.split(':').map(Number);
        const signOutTime = new Date(date);
        signOutTime.setHours(eh < sh ? eh + 24 : eh, Math.floor(Math.random() * 15), 0, 0);

        await prisma.attendance.create({
          data: { guardId: guards[shift.guardIdx].id, siteId: sites[shift.siteIdx].id, deploymentId: deployment.id, type: 'CHECK_IN', timestamp: signInTime, latitude: sites[shift.siteIdx].latitude, longitude: sites[shift.siteIdx].longitude, isWithinGeofence: true, biometricVerified: true },
        });
        await prisma.attendance.create({
          data: { guardId: guards[shift.guardIdx].id, siteId: sites[shift.siteIdx].id, deploymentId: deployment.id, type: 'CHECK_OUT', timestamp: signOutTime, latitude: sites[shift.siteIdx].latitude, longitude: sites[shift.siteIdx].longitude, isWithinGeofence: true, biometricVerified: true },
        });
        totalAtt += 2;
      }
    }

    // Incidents
    const incCount = Math.floor(Math.random() * 3);
    for (let i = 0; i < incCount; i++) {
      const gi = Math.floor(Math.random() * guards.length);
      const si = Math.floor(Math.random() * sites.length);
      const incTime = new Date(date);
      incTime.setHours(8 + Math.floor(Math.random() * 14), Math.floor(Math.random() * 60), 0, 0);
      await prisma.incident.create({
        data: {
          reportedById: guards[gi].id,
          siteId: sites[si].id,
          category: categories[Math.floor(Math.random() * categories.length)],
          description: incidentDescs[Math.floor(Math.random() * incidentDescs.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          status: daysAgo > 5 ? 'RESOLVED' : 'OPEN',
          latitude: sites[si].latitude,
          longitude: sites[si].longitude,
          assignedToId: Math.random() > 0.4 ? supervisor.id : null,
          resolvedById: daysAgo > 5 ? supervisor.id : null,
          resolutionNote: daysAgo > 5 ? 'Investigated and resolved.' : null,
          resolvedAt: daysAgo > 5 ? incTime : null,
          createdAt: incTime,
        },
      });
      totalInc++;
    }
  }
  console.log(`✅ Historical data: ${totalDep} deployments, ${totalAtt} attendance, ${totalInc} incidents`);

  // === LEAVE REQUESTS ===
  await prisma.leaveRequest.create({
    data: { guardId: guards[1].id, leaveType: 'ANNUAL', startDate: new Date('2026-04-10'), endDate: new Date('2026-04-14'), reason: 'Family vacation', status: 'APPROVED', approverId: hr.id },
  });
  await prisma.leaveRequest.create({
    data: { guardId: guards[3].id, leaveType: 'SICK', startDate: new Date('2026-04-07'), endDate: new Date('2026-04-08'), reason: 'Fever and malaria', status: 'PENDING' },
  });
  console.log(`✅ Leave requests created`);

  // === WEAPON ISSUANCES (recent) ===
  const today = new Date(); today.setHours(7, 0, 0, 0);
  await prisma.weaponIssuance.create({
    data: { weaponId: weapons[0].id, guardId: guards[0].id, siteId: sites[0].id, supervisorId: supervisor.id, shiftType: 'DAY', issueTimestamp: today, roundsIssued: 15 },
  });
  await prisma.weaponRecord.update({ where: { id: weapons[0].id }, data: { status: 'ISSUED' } });

  // === INVOICES ===
  const invoice1 = await prisma.invoice.create({
    data: {
      contractId: contract1.id, clientId: client.id,
      billingPeriodStart: new Date('2026-03-01'), billingPeriodEnd: new Date('2026-03-31'),
      totalShifts: 186, totalAmount: 9300000, finalAmount: 9300000, status: 'SENT',
      dueDate: new Date('2026-04-30'), sentAt: new Date('2026-04-01'),
    },
  });
  await prisma.invoice.create({
    data: {
      contractId: contract1.id, clientId: client.id,
      billingPeriodStart: new Date('2026-02-01'), billingPeriodEnd: new Date('2026-02-28'),
      totalShifts: 168, totalAmount: 8400000, finalAmount: 8400000, status: 'PAID',
      dueDate: new Date('2026-03-30'), sentAt: new Date('2026-03-01'),
    },
  });
  await prisma.payment.create({
    data: { invoiceId: invoice1.id, amount: 5000000, paymentDate: new Date('2026-04-03'), method: 'BANK_TRANSFER', reference: 'TXN-001-2026' },
  });
  console.log(`✅ Invoices and payments created`);

  // === SPECIAL DUTY ===
  const specialDuty1 = await prisma.specialDuty.create({
    data: {
      title: 'VIP Airport Security Detail', assignmentType: 'VIP_PROTECTION',
      location: 'Entebbe International Airport', date: new Date('2026-04-10'),
      startTime: '08:00', endTime: '20:00', reportingSupervisorId: supervisor.id,
      paymentPerPerson: 75000, createdById: opsManager.id, status: 'PENDING_CONFIRMATION',
      responseDeadline: new Date('2026-04-08'), totalPaymentLiability: 225000,
      personnel: { create: [
        { userId: guards[0].id }, { userId: guards[2].id }, { userId: guards[4].id },
      ] },
    },
  });
  const specialDuty2 = await prisma.specialDuty.create({
    data: {
      title: 'Music Concert Security — Kololo Grounds', assignmentType: 'EVENT',
      location: 'Kololo Independence Grounds', date: new Date('2026-04-15'),
      startTime: '14:00', endTime: '00:00', reportingSupervisorId: supervisor2.id,
      paymentPerPerson: 60000, createdById: opsManager.id, status: 'CONFIRMED',
      responseDeadline: new Date('2026-04-12'), totalPaymentLiability: 120000,
      personnel: { create: [
        { userId: guards[1].id, confirmStatus: 'CONFIRMED' },
        { userId: guards[3].id, confirmStatus: 'CONFIRMED' },
      ] },
    },
  });
  console.log(`✅ Special duties created`);

  // === PAYROLL (current month) ===
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();
  const daysInMonth = new Date(thisYear, thisMonth, 0).getDate();
  const dailyRate = 200000 / daysInMonth;
  for (let i = 0; i < 5; i++) {
    const shiftsWorked = 14 + Math.floor(Math.random() * 8);
    await prisma.payrollRecord.create({
      data: {
        guardId: guards[i].id, payrollMonth: thisMonth, payrollYear: thisYear,
        monthlySalary: 200000, totalDaysInMonth: daysInMonth, dailyRate,
        totalShiftsWorked: shiftsWorked, overtimeShifts: Math.floor(Math.random() * 2),
        totalPayrollAmount: dailyRate * shiftsWorked, netPay: dailyRate * shiftsWorked,
        specialDutyTotal: i < 2 ? 75000 : 0, status: 'DRAFT',
      },
    });
  }
  console.log(`✅ Payroll records created`);

  // === SPOT CHECKS ===
  const activeDeployment = await prisma.deployment.findFirst({ where: { status: 'ACTIVE' } });
  if (activeDeployment) {
    await prisma.spotCheck.create({
      data: {
        guardId: activeDeployment.guardId, deploymentId: activeDeployment.id,
        siteId: activeDeployment.siteId, shiftType: activeDeployment.shiftType,
        performedById: supervisor.id, biometricResult: 'PASS',
        gpsLat: sites[0].latitude, gpsLng: sites[0].longitude, resultNotes: 'Guard present and alert.',
      },
    });
  }
  console.log(`✅ Spot checks created`);

  // === FOOD SUPPLIER ===
  const foodAccount = await prisma.foodSupplierAccount.create({
    data: { userId: foodUser.id, supplierName: 'Mama Rosa Catering', contactPerson: 'Rosa Nabwire', contactPhone: '+256700300300' },
  });
  await prisma.foodSupplierSite.create({
    data: { foodSupplierAccountId: foodAccount.id, siteId: sites[0].id, mealPricePerPerson: 5000, mealPeriods: 'BOTH' },
  });
  await prisma.foodSupplierSite.create({
    data: { foodSupplierAccountId: foodAccount.id, siteId: sites[1].id, mealPricePerPerson: 5000, mealPeriods: 'LUNCH' },
  });
  console.log(`✅ Food supplier account and site links created`);

  // === NOTIFICATIONS ===
  const notifs = [
    { userId: ceo.id, title: 'System Ready', message: 'DDBMS v1.4 has been successfully deployed.', type: 'INFO' },
    { userId: admin.id, title: 'Critical Incident', message: 'A critical incident was reported at ABC Corp HQ', type: 'ALERT' },
    { userId: armoury.id, title: 'Weapon Licence Expiring', message: 'UPF-005-2024 licence expires on 31 Dec 2025', type: 'WARNING' },
    { userId: finance.id, title: 'Invoice Overdue', message: 'Invoice for ABC Corp March has outstanding balance', type: 'WARNING' },
    { userId: hr.id, title: 'Leave Request Pending', message: 'Rose Atim has a pending sick leave request', type: 'INFO' },
    { userId: supervisor.id, title: 'New Assignment', message: 'VIP Airport Security Detail scheduled for 10 Apr', type: 'INFO' },
    { userId: guards[0].id, title: 'Special Duty Invitation', message: 'You have been selected for VIP Airport Security Detail on 10 Apr. Payment: UGX 75,000', type: 'INFO' },
    { userId: procurement.id, title: 'Purchase Request Pending', message: '20 guard uniforms requested by HR — awaiting your review', type: 'INFO' },
    { userId: logistics.id, title: 'Low Stock Alert', message: 'Acacia Mall: Motorola Radios below minimum threshold', type: 'WARNING' },
  ];
  for (const n of notifs) await prisma.notification.create({ data: n });
  console.log(`✅ Notifications created`);

  // === URSB BRAP DATA & REPORTS ===
  if (guards.length > 1 && sites.length > 1) {
    await prisma.personnelMovement.create({
      data: {
        guardId: guards[0].id, movementType: 'TRANSFER', fromSiteId: sites[0].id, toSiteId: sites[1].id,
        reason: 'Requested transfer to new location', effectiveDate: new Date(), status: 'COMPLETED', approvedById: hr.id, notes: 'Approved by regional manager'
      }
    });
    
    await prisma.changeSheet.create({
      data: {
        guardId: guards[1].id, changeType: 'SALARY', reason: 'Annual increment', amount: 250000,
        previousValue: '200000', newValue: '250000', status: 'APPROVED', approvedById: hr.id, approvedAt: new Date()
      }
    });

    await prisma.deploymentReport.create({
      data: {
        reportDate: new Date(), reportType: 'DAILY_COVERAGE', generatedById: 'SYSTEM', totalGuards: 20, deployedGuards: 18, coveragePercent: 90, scheduleSlot: '8AM',
        absentGuards: JSON.stringify([{ guardId: guards[2].id, name: guards[2].name, reason: 'No-show for shift' }]),
      }
    });
    console.log(`✅ URSB BRAP & Deployment Reports seeded`);
  }

  console.log('\n🎉 DDBMS v1.4 Seed Complete!\n');
  console.log('📋 LOGIN CREDENTIALS:');
  console.log('  CEO:                ceo@security.com          / ceo123');
  console.log('  Admin:              admin@security.com         / admin123');
  console.log('  Ops Manager:        ops@security.com           / ops123');
  console.log('  Regional Manager:   regional@security.com      / regional123');
  console.log('  HR Officer:         hr@security.com            / hr123');
  console.log('  Finance Officer:    finance@security.com       / finance123');
  console.log('  Armoury Officer:    armoury@security.com       / armoury123');
  console.log('  Procurement:        procurement@security.com   / proc123');
  console.log('  Logistics:          logistics@security.com     / log123');
  console.log('  Supervisor:         supervisor@security.com    / sup123');
  console.log('  M&E Analyst:        analyst@security.com       / analyst123');
  console.log('  Guard 1-8:          guard1@security.com        / guard123');
  console.log('  Client 1:           client@company.com         / client123');
  console.log('  Client 2:           client2@company.com        / client123');
  console.log('  Food Supplier:      food@supplier.com          / food123');
  console.log('\n  Biometric PIN for all guards/supervisors: 1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
