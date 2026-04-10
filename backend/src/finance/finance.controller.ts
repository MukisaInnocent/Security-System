import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('contracts')
  @Roles('ADMIN','CEO','FINANCE')
  findAllContracts(@Query('status') status?: string) { return this.financeService.findAllContracts(status); }

  @Get('contracts/expiring')
  @Roles('ADMIN','CEO','FINANCE')
  getExpiringContracts() { return this.financeService.checkExpiringContracts(); }

  @Get('contracts/:id')
  @Roles('ADMIN','CEO','FINANCE')
  findContract(@Param('id') id: string) { return this.financeService.findContract(id); }

  @Post('contracts')
  @Roles('ADMIN','FINANCE')
  createContract(@Body() body: any) { return this.financeService.createContract(body); }

  @Patch('contracts/:id')
  @Roles('ADMIN','FINANCE')
  updateContract(@Param('id') id: string, @Body() body: any) { return this.financeService.updateContract(id, body); }

  @Get('invoices')
  @Roles('ADMIN','CEO','FINANCE')
  findAllInvoices(@Query('clientId') clientId?: string, @Query('status') status?: string) {
    return this.financeService.findAllInvoices(clientId, status);
  }

  @Post('invoices/generate')
  @Roles('ADMIN','FINANCE')
  generateInvoice(@Body() body: any) { return this.financeService.generateInvoice(body); }

  @Patch('invoices/:id')
  @Roles('ADMIN','FINANCE')
  updateInvoice(@Param('id') id: string, @Body() body: any) { return this.financeService.updateInvoice(id, body); }

  @Post('invoices/:id/payment')
  @Roles('ADMIN','FINANCE')
  recordPayment(@Param('id') id: string, @Body() body: any) { return this.financeService.recordPayment(id, body); }

  @Get('reports/monthly')
  @Roles('ADMIN','CEO','FINANCE')
  getMonthlyReport(@Query('year') year: string, @Query('month') month: string) {
    return this.financeService.getMonthlyRevenueReport(+year, +month);
  }

  @Get('reports/contract-vs-actual')
  @Roles('ADMIN','CEO','FINANCE','OPS_MANAGER')
  getContractVsActual() { return this.financeService.getContractVsActualReport(); }
}
