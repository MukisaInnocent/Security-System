const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf-8');

// 1. Add SubscriptionPlan
if (!content.includes('model SubscriptionPlan')) {
  content += `\n
model SubscriptionPlan {
  id               String   @id @default(uuid())
  name             String   // e.g., Starter, Professional, Enterprise
  pricePerMonth    Float
  maxGuards        Int?     // null means unlimited
  maxSites         Int?
  features         String   // JSON array of feature flags
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  tenants Tenant[]
}
`;
}

// 2. Update Tenant
if (!content.includes('logoUrl')) {
  content = content.replace(/model Tenant \{([\s\S]*?)createdAt\s+DateTime/, (match, p1) => {
    return `model Tenant {${p1}` +
           `  logoUrl            String?\n` +
           `  primaryColor       String?  @default("#0f172a")\n` +
           `  secondaryColor     String?  @default("#3b82f6")\n` +
           `  subscriptionPlanId String?\n` +
           `  subscriptionStatus String   @default("TRIAL") // TRIAL, ACTIVE, PAST_DUE, CANCELED\n` +
           `  trialEndsAt        DateTime?\n` +
           `  createdAt          DateTime`;
  });
  content = content.replace(/users\s+User\[\]/, 'plan    SubscriptionPlan? @relation(fields: [subscriptionPlanId], references: [id])\n  users   User[]');
}

// 3. Inject tenantId into models that need it
const excludeModels = ['Tenant', 'SubscriptionPlan', 'User', 'Region', 'Site'];

content = content.replace(/model\s+([A-Za-z0-9_]+)\s+{([\s\S]*?)}/g, (match, modelName, body) => {
  if (excludeModels.includes(modelName)) return match;
  if (body.includes('tenantId')) return match;

  // Insert before the first @@ or at the end
  let insertIdx = body.indexOf('@@');
  if (insertIdx === -1) {
    // If no @@, insert right at the end
    const trimmedBody = body.replace(/\s+$/, '');
    return `model ${modelName} {${trimmedBody}\n  tenantId String?\n  tenant   Tenant? @relation(fields: [tenantId], references: [id])\n}`;
  } else {
    // Insert before @@
    const before = body.substring(0, insertIdx);
    const after = body.substring(insertIdx);
    return `model ${modelName} {${before}  tenantId String?\n  tenant   Tenant? @relation(fields: [tenantId], references: [id])\n\n  ${after}}`;
  }
});

fs.writeFileSync(schemaPath, content);
console.log('Successfully updated schema.prisma robustly');
