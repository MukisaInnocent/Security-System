import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Controller('onboarding')
export class TenantOnboardingController {
  constructor(private prisma: PrismaService) {}

  @Post('register')
  async registerTenant(@Body() dto: any) {
    const { companyName, companyCode, adminName, adminEmail, adminPassword, planName } = dto;

    if (!companyName || !companyCode || !adminEmail || !adminPassword) {
      throw new BadRequestException('Missing required fields');
    }

    // Ensure companyCode and adminEmail are unique
    const existingTenant = await this.prisma.tenant.findUnique({ where: { code: companyCode } });
    if (existingTenant) {
      throw new BadRequestException('Company code already in use');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    // Default to a mock plan if none provided
    let plan = await this.prisma.subscriptionPlan.findFirst({ where: { name: planName || 'Starter' } });
    if (!plan) {
      // Mock plan creation if it doesn't exist yet (for easy testing)
      plan = await this.prisma.subscriptionPlan.create({
        data: {
          name: 'Starter',
          pricePerMonth: 0,
          features: JSON.stringify(['basic_reporting', 'up_to_50_guards']),
        }
      });
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create the tenant and its admin user in a transaction
    // We use the global raw prisma client here because we are bootstrapping a tenant
    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: companyName,
          code: companyCode,
          subscriptionPlanId: plan.id,
          subscriptionStatus: 'TRIAL',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 day trial
        },
      });

      const user = await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: 'TENANT_ADMIN',
          tenantId: tenant.id,
        },
      });

      return { tenant, user };
    });

    return {
      message: 'Company registered successfully',
      tenantId: result.tenant.id,
      adminEmail: result.user.email,
    };
  }
}
