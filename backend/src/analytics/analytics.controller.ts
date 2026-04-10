import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('attendance-trend')
  @Roles('ADMIN', 'OPS_MANAGER', 'M_AND_E')
  async getAttendanceTrend(@Query('days') days?: string) {
    return this.analyticsService.getAttendanceTrend(days ? parseInt(days) : 30);
  }

  @Get('incident-trend')
  @Roles('ADMIN', 'OPS_MANAGER', 'M_AND_E')
  async getIncidentTrend(@Query('days') days?: string) {
    return this.analyticsService.getIncidentTrend(days ? parseInt(days) : 30);
  }

  @Get('guard-performance')
  @Roles('ADMIN', 'OPS_MANAGER', 'SUPERVISOR', 'M_AND_E')
  async getGuardPerformance() {
    return this.analyticsService.getGuardPerformance();
  }

  @Get('site-summary')
  @Roles('ADMIN', 'OPS_MANAGER', 'M_AND_E')
  async getSiteSummary() {
    return this.analyticsService.getSiteSummary();
  }

  @Get('export')
  @Roles('ADMIN', 'M_AND_E')
  async exportData(
    @Query('type') type: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.exportData(type, startDate, endDate);
  }
}
