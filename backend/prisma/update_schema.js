const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. Tenant: Replace Attendance with OvertimeRecord
schema = schema.replace('  Attendance              Attendance[]\n', '');
if (!schema.includes('OvertimeRecord          OvertimeRecord[]')) {
    schema = schema.replace('  SiteInventory           SiteInventory[]\n', '  SiteInventory           SiteInventory[]\n  OvertimeRecord          OvertimeRecord[]\n');
}

// 2. Site: Replace attendances with overtimeRecords
schema = schema.replace('  attendances       Attendance[]\n', '');
if (!schema.includes('overtimeRecords   OvertimeRecord[]')) {
    schema = schema.replace('  clientSites       ClientSite[]\n', '  clientSites       ClientSite[]\n  overtimeRecords   OvertimeRecord[]\n');
}

// 3. Deployment: Remove attendances
schema = schema.replace('  attendances    Attendance[]\n', '');

// 4. User: Replace attendances with overtimeRecords
schema = schema.replace('  attendances              Attendance[]\n', '');
if (!schema.includes('overtimeRecords')) {
    schema = schema.replace('  leaveRequests            LeaveRequest[]         @relation("GuardLeaveRequests")\n', '  leaveRequests            LeaveRequest[]         @relation("GuardLeaveRequests")\n  overtimeRecords          OvertimeRecord[]       @relation("GuardOvertime")\n  approvedOvertime         OvertimeRecord[]       @relation("SupervisorOvertime")\n');
}

// 5. GuardProfile: Add fields
if (!schema.includes('nextOfKin')) {
    schema = schema.replace('  isPermanent         Boolean   @default(false)\n', 
`  isPermanent         Boolean   @default(false)
  nin                 String?
  village             String?
  parish              String?
  subCounty           String?
  county              String?
  district            String?
`);
    schema = schema.replace('  primaryPost Post? @relation("PrimaryGuardPost", fields: [primaryPostId], references: [id])\n',
`  primaryPost Post? @relation("PrimaryGuardPost", fields: [primaryPostId], references: [id])
  nextOfKin   NextOfKin[]
`);
}

// 6. SpotCheck: Add fields
if (!schema.includes('checkInTime')) {
    schema = schema.replace('  resultNotes        String?\n',
`  resultNotes        String?
  checkInTime        DateTime?
  checkOutTime       DateTime?
  isPresent          Boolean   @default(true)
`);
}

// 7. GuardCharge: Add fields
if (!schema.includes('amount')) {
    schema = schema.replace('  statusNotes       String?\n',
`  statusNotes       String?
  amount            Float?
  evidenceUrl       String?
  guardConfirmed    Boolean   @default(false)
  operationsStatus  String    @default("PENDING") // PENDING, APPROVED, VOIDED
`);
}

// 8. Remove Attendance Model completely
schema = schema.replace(/model Attendance\s*{[\s\S]*?@@index\(\[offlineId\]\)\n}/g, '');

// 9. Add NextOfKin and OvertimeRecord Models
if (!schema.includes('model NextOfKin')) {
    const modelsToAdd = `
model NextOfKin {
  id           String   @id @default(uuid())
  guardId      String
  name         String
  phone        String
  nin          String?
  village      String?
  parish       String?
  subCounty    String?
  county       String?
  district     String?
  relationship String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  guard GuardProfile @relation(fields: [guardId], references: [id])

  @@index([guardId])
}

model OvertimeRecord {
  id           String   @id @default(uuid())
  guardId      String
  siteId       String
  supervisorId String?
  date         DateTime
  hours        Float
  status       String   @default("PENDING") // PENDING, APPROVED, PAID
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  guard      User   @relation("GuardOvertime", fields: [guardId], references: [id])
  supervisor User?  @relation("SupervisorOvertime", fields: [supervisorId], references: [id])
  site       Site   @relation(fields: [siteId], references: [id])
  tenantId   String?
  tenant     Tenant? @relation(fields: [tenantId], references: [id])

  @@index([guardId])
  @@index([siteId])
}
`;
    // Add models before "model Region" or at the end of HR models. Let's add them before "model Site"
    schema = schema.replace('// ============================================================\n// SITE AND POST MODELS', modelsToAdd + '\n// ============================================================\n// SITE AND POST MODELS');
}

fs.writeFileSync(schemaPath, schema);
console.log('Schema updated successfully');
