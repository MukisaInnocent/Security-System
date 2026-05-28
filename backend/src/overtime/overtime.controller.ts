import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { OvertimeService } from './overtime.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('overtime')
export class OvertimeController {
  constructor(private readonly overtimeService: OvertimeService) {}

  @Get()
  @Roles('ADMIN', 'CEO', 'OPS_MANAGER', 'HR', 'SUPERVISOR', 'FINANCE')
  getOvertimeRecords(
    @Query('siteId') siteId?: string,
    @Query('guardId') guardId?: string,
    @Query('status') status?: string,
  ) {
    return this.overtimeService.getOvertimeRecords(siteId, guardId, status);
  }

  @Post()
  @Roles('ADMIN', 'CEO', 'OPS_MANAGER', 'SUPERVISOR')
  createOvertimeRecord(@Body() data: any, @Req() req: any) {
    return this.overtimeService.createOvertimeRecord(data, req.user.userId);
  }

  @Patch(':id/approve')
  @Roles('ADMIN', 'CEO', 'OPS_MANAGER')
  approveOvertime(
    @Param('id') id: string,
    @Body() data: { approved: boolean; notes?: string },
  ) {
    return this.overtimeService.approveOvertime(id, data.approved, data.notes);
  }
}
