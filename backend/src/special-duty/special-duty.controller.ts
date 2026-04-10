import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { SpecialDutyService } from './special-duty.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('special-duty')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SpecialDutyController {
  constructor(private readonly specialDutyService: SpecialDutyService) {}

  @Get()
  findAll(@Query('status') status?: string) { return this.specialDutyService.findAll(status); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.specialDutyService.findOne(id); }

  @Post()
  @Roles('ADMIN','CEO','OPS_MANAGER')
  create(@Body() body: any, @Req() req: any) { return this.specialDutyService.create(body, req.user.id); }

  @Patch(':id/respond')
  respond(@Param('id') id: string, @Req() req: any, @Body() body: { confirmed: boolean; declineReason?: string }) {
    return this.specialDutyService.respond(id, req.user.id, body.confirmed, body.declineReason);
  }

  @Patch(':id/attendance')
  @Roles('ADMIN','CEO','OPS_MANAGER','SUPERVISOR')
  markAttendance(@Param('id') id: string, @Body() body: { userId: string; attended: boolean }) {
    return this.specialDutyService.markAttendance(id, body.userId, body.attended);
  }

  @Patch(':id/complete')
  @Roles('ADMIN','CEO','OPS_MANAGER')
  complete(@Param('id') id: string) { return this.specialDutyService.complete(id); }

  @Patch(':id/cancel')
  @Roles('ADMIN','CEO','OPS_MANAGER')
  cancel(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.specialDutyService.cancel(id, body.reason);
  }
}
