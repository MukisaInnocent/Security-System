import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProcurementService {
  constructor(private prisma: PrismaService) {}

  // === SUPPLIERS ===
  async findAllSuppliers() {
    return this.prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  }

  async createSupplier(data: any) {
    return this.prisma.supplier.create({ data });
  }

  async updateSupplier(id: string, data: any) {
    return this.prisma.supplier.update({ where: { id }, data });
  }

  // === PURCHASE REQUESTS ===
  async findAllRequests(status?: string, department?: string) {
    return this.prisma.purchaseRequest.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(department ? { department } : {}),
      },
      include: { requestedBy: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPurchaseRequest(data: any, requestedById: string) {
    return this.prisma.purchaseRequest.create({
      data: { ...data, requestedById },
      include: { requestedBy: { select: { id: true, name: true } } },
    });
  }

  async approveRequest(id: string, approved: boolean, rejectReason?: string) {
    const req = await this.prisma.purchaseRequest.findUnique({ where: { id }, include: { requestedBy: true } });
    if (!req) throw new NotFoundException('Purchase request not found');

    const updated = await this.prisma.purchaseRequest.update({
      where: { id },
      data: { status: approved ? 'APPROVED' : 'REJECTED', rejectReason: !approved ? rejectReason : null },
    });

    await this.prisma.notification.create({
      data: {
        userId: req.requestedById,
        title: `Purchase Request ${approved ? 'Approved' : 'Rejected'}`,
        message: `Your request for "${req.itemDescription}" has been ${approved ? 'approved' : 'rejected'}${!approved && rejectReason ? ': ' + rejectReason : ''}.`,
        type: approved ? 'INFO' : 'WARNING',
        link: `/procurement?id=${req.id}`,
      },
    });

    return updated;
  }

  // === PURCHASE ORDERS ===
  async findAllOrders(status?: string) {
    return this.prisma.purchaseOrder.findMany({
      where: status ? { status } : {},
      include: {
        supplier: { select: { id: true, name: true } },
        orderItems: true,
        purchaseRequests: { select: { id: true, itemDescription: true, requestedBy: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPurchaseOrder(data: any) {
    const { items, requestIds, ...orderData } = data;

    const order = await this.prisma.purchaseOrder.create({
      data: {
        ...orderData,
        totalAmount: items?.reduce((sum: number, i: any) => sum + i.totalPrice, 0) || 0,
        orderItems: items ? { create: items } : undefined,
      },
      include: { supplier: true, orderItems: true },
    });

    // Link purchase requests to this order
    if (requestIds?.length) {
      await this.prisma.purchaseRequest.updateMany({
        where: { id: { in: requestIds } },
        data: { linkedOrderId: order.id, status: 'FULFILLED' },
      });
    }

    return order;
  }

  async confirmDelivery(id: string) {
    const order = await this.prisma.purchaseOrder.findUnique({ where: { id }, include: { orderItems: true } });
    if (!order) throw new NotFoundException('Purchase order not found');

    await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'DELIVERED', deliveredDate: new Date() },
    });

    return { message: 'Delivery confirmed. Please update site inventory through the Logistics module.' };
  }

  async getSpendingReport(startDate?: string, endDate?: string) {
    const orders = await this.prisma.purchaseOrder.findMany({
      where: {
        status: 'DELIVERED',
        ...(startDate ? { deliveredDate: { gte: new Date(startDate) } } : {}),
        ...(endDate ? { deliveredDate: { ...( startDate ? { gte: new Date(startDate) } : {}), lte: new Date(endDate) } } : {}),
      },
      include: { supplier: { select: { name: true } }, orderItems: true },
    });
    const total = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    return { orders, total };
  }
}
