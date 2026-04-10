import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('guard')
  async getGuardDashboard(@Request() req: any) {
    return this.dashboardService.getGuardDashboard(req.user.id);
  }

  @Get('supervisor')
  async getSupervisorDashboard() {
    return this.dashboardService.getSupervisorDashboard();
  }

  @Get('client')
  async getClientDashboard(@Request() req: any) {
    return this.dashboardService.getClientDashboard(req.user.id);
  }
}
