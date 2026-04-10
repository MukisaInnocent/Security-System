import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('logistics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Get('distributions')
  findAllDistributions(@Query('siteId') siteId?: string) {
    return this.logisticsService.findAllDistributions(siteId);
  }

  @Post('distributions')
  @Roles('ADMIN','LOGISTICS_OFFICER')
  createDistribution(@Body() body: any, @Req() req: any) {
    return this.logisticsService.createDistribution(body, req.user.id);
  }

  @Get('inventory')
  getSiteInventory(@Query('siteId') siteId?: string) {
    return this.logisticsService.getSiteInventory(siteId);
  }

  @Get('alerts')
  getLowStockAlerts() {
    return this.logisticsService.getLowStockAlerts();
  }

  @Post('transfers')
  @Roles('ADMIN','LOGISTICS_OFFICER')
  recordTransfer(@Body() body: any) {
    return this.logisticsService.recordTransfer(body);
  }

  @Get('reports/distributions')
  @Roles('ADMIN','CEO','LOGISTICS_OFFICER','FINANCE')
  getDistributionReport(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.logisticsService.getDistributionReport(startDate, endDate);
  }
}
