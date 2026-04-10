import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('payroll')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get()
  @Roles('ADMIN','CEO','FINANCE','HR')
  getPayrollRecords(@Query('month') month?: string, @Query('year') year?: string, @Query('status') status?: string) {
    return this.payrollService.getPayrollRecords(month ? +month : undefined, year ? +year : undefined, status);
  }

  @Get('guard/:id')
  getGuardPayroll(@Param('id') id: string, @Req() req: any) {
    return this.payrollService.getGuardPayroll(id, req.user.id, req.user.role);
  }

  @Get('guard/:id/current')
  getCurrentMonthSummary(@Param('id') id: string) {
    return this.payrollService.getCurrentMonthSummary(id);
  }

  @Post('generate')
  @Roles('ADMIN','FINANCE')
  generatePayroll(@Body() body: { month: number; year: number }) {
    return this.payrollService.generatePayrollRun(body.month, body.year);
  }

  @Patch(':id/approve')
  @Roles('ADMIN','FINANCE')
  approvePayroll(@Param('id') id: string, @Req() req: any) {
    return this.payrollService.approvePayroll(id, req.user.id);
  }

  @Get('reports/monthly')
  @Roles('ADMIN','CEO','FINANCE','HR')
  getMonthlyReport(@Query('month') month: string, @Query('year') year: string) {
    return this.payrollService.getPayrollReport(+month, +year);
  }
}
