import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  // === CONTRACTS ===
  async findAllContracts(status?: string) {
    const contracts = await this.prisma.contract.findMany({
      where: status ? { status } : {},
      include: {
        contractSites: { include: { site: { select: { id: true, name: true } } } },
        _count: { select: { invoices: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    const clientIds = [...new Set(contracts.map(c => c.clientId))];
    const clients = await this.prisma.user.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, name: true },
    });
    const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]));

    return contracts.map(c => ({
      ...c,
      clientName: clientMap[c.clientId] || 'Unknown Client',
      billingRatePerDay: c.billingRate,
    }));
  }

  async findContract(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        contractSites: { include: { site: true } },
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async createContract(data: any) {
    const { siteIds, ...contractData } = data;
    return this.prisma.contract.create({
      data: {
        ...contractData,
        startDate: new Date(contractData.startDate),
        endDate: contractData.endDate ? new Date(contractData.endDate) : null,
        contractSites: siteIds?.length ? { create: siteIds.map((siteId: string) => ({ siteId })) } : undefined,
      },
      include: { contractSites: { include: { site: { select: { id: true, name: true } } } } },
    });
  }

  async updateContract(id: string, data: any) {
    return this.prisma.contract.update({ where: { id }, data });
  }

  async checkExpiringContracts() {
    const thirtyDaysFromNow = new Date(); thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const sevenDaysFromNow = new Date(); sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return this.prisma.contract.findMany({
      where: { status: 'ACTIVE', endDate: { lte: thirtyDaysFromNow, gte: new Date() } },
      include: { contractSites: { include: { site: { select: { name: true } } } } },
      orderBy: { endDate: 'asc' },
    });
  }

  // === INVOICES ===
  async findAllInvoices(clientId?: string, status?: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        ...(clientId ? { clientId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        contract: { select: { contractNumber: true, billingRate: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    const clientIds = [...new Set(invoices.map(i => i.clientId))];
    const clients = await this.prisma.user.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, name: true },
    });
    const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]));

    return invoices.map(i => ({
      ...i,
      clientName: clientMap[i.clientId] || 'Unknown Client',
    }));
  }

  async generateInvoice(data: { contractId: string; billingPeriodStart: string; billingPeriodEnd: string }) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: data.contractId },
      include: { contractSites: { select: { siteId: true } } },
    });
    if (!contract) throw new NotFoundException('Contract not found');

    const siteIds = contract.contractSites.map(cs => cs.siteId);
    const start = new Date(data.billingPeriodStart);
    const end = new Date(data.billingPeriodEnd);

    // Count completed deployments in the billing period for these sites
    const deployments = await this.prisma.deployment.count({
      where: {
        siteId: { in: siteIds },
        status: 'COMPLETED',
        date: { gte: start, lte: end },
      },
    });

    const totalAmount = deployments * contract.billingRate;

    return this.prisma.invoice.create({
      data: {
        contractId: contract.id,
        clientId: contract.clientId,
        billingPeriodStart: start,
        billingPeriodEnd: end,
        totalShifts: deployments,
        totalAmount,
        finalAmount: totalAmount,
        status: 'DRAFT',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async updateInvoice(id: string, data: any) {
    const inv = await this.prisma.invoice.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException('Invoice not found');
    // Recalculate final amount
    const finalAmount = (data.totalAmount ?? inv.totalAmount) + (data.adjustments ?? inv.adjustments ?? 0);
    return this.prisma.invoice.update({ where: { id }, data: { ...data, finalAmount } });
  }

  async recordPayment(invoiceId: string, paymentData: any) {
    const payment = await this.prisma.payment.create({
      data: { invoiceId, ...paymentData, paymentDate: new Date(paymentData.paymentDate) },
    });

    // Check if invoice is fully paid
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId }, include: { payments: true } });
    if (!invoice) return payment;
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid >= invoice.finalAmount) {
      await this.prisma.invoice.update({ where: { id: invoiceId }, data: { status: 'PAID' } });
    }

    return payment;
  }

  // === REPORTS ===
  async getMonthlyRevenueReport(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const invoices = await this.prisma.invoice.findMany({
      where: { billingPeriodStart: { gte: startDate }, billingPeriodEnd: { lte: endDate } },
      include: { payments: true, contract: { select: { contractNumber: true } } },
    });

    const totalInvoiced = invoices.reduce((sum, i) => sum + i.finalAmount, 0);
    const totalReceived = invoices.flatMap(i => i.payments).reduce((sum, p) => sum + p.amount, 0);
    return { invoices, totalInvoiced, totalReceived, outstanding: totalInvoiced - totalReceived };
  }

  async getContractVsActualReport() {
    const contracts = await this.prisma.contract.findMany({
      where: { status: 'ACTIVE' },
      include: { contractSites: { include: { site: { select: { name: true } } } } },
    });

    const today = new Date(); today.setHours(0,0,0,0);
    const results = await Promise.all(contracts.map(async (c) => {
      const siteIds = c.contractSites.map(cs => cs.siteId);
      const required = c.requiredGuardsPerShift * siteIds.length;
      const actualToday = await this.prisma.deployment.count({
        where: {
          siteId: { in: siteIds },
          date: { gte: today },
          status: { in: ['ACTIVE','COMPLETED'] },
        },
      });
      return { contract: c, required, actual: actualToday, shortfall: Math.max(0, required - actualToday) };
    }));

    return results;
  }
}
