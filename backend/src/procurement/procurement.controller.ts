import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('procurement')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Get('suppliers')
  findAllSuppliers() { return this.procurementService.findAllSuppliers(); }

  @Post('suppliers')
  @Roles('ADMIN','PROCUREMENT_OFFICER')
  createSupplier(@Body() body: any) { return this.procurementService.createSupplier(body); }

  @Patch('suppliers/:id')
  @Roles('ADMIN','PROCUREMENT_OFFICER')
  updateSupplier(@Param('id') id: string, @Body() body: any) { return this.procurementService.updateSupplier(id, body); }

  @Get('requests')
  findAllRequests(@Query('status') status?: string, @Query('department') department?: string) {
    return this.procurementService.findAllRequests(status, department);
  }

  @Post('requests')
  createRequest(@Body() body: any, @Req() req: any) {
    return this.procurementService.createPurchaseRequest(body, req.user.id);
  }

  @Patch('requests/:id/approve')
  @Roles('ADMIN','PROCUREMENT_OFFICER')
  approveRequest(@Param('id') id: string, @Body() body: { approved: boolean; rejectReason?: string }) {
    return this.procurementService.approveRequest(id, body.approved, body.rejectReason);
  }

  @Get('orders')
  findAllOrders(@Query('status') status?: string) { return this.procurementService.findAllOrders(status); }

  @Post('orders')
  @Roles('ADMIN','PROCUREMENT_OFFICER')
  createOrder(@Body() body: any) { return this.procurementService.createPurchaseOrder(body); }

  @Patch('orders/:id/deliver')
  @Roles('ADMIN','PROCUREMENT_OFFICER')
  confirmDelivery(@Param('id') id: string) { return this.procurementService.confirmDelivery(id); }

  @Get('reports/spending')
  @Roles('ADMIN','CEO','PROCUREMENT_OFFICER','FINANCE')
  getSpendingReport(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.procurementService.getSpendingReport(startDate, endDate);
  }
}
