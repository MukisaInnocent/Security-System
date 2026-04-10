import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('hr')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('guards')
  @Roles('ADMIN','CEO','HR','FINANCE','OPS_MANAGER')
  getAllGuardProfiles() {
    return this.hrService.getAllGuardProfiles();
  }

  @Get('guards/:id')
  @Roles('ADMIN','CEO','HR','OPS_MANAGER')
  getGuardProfile(@Param('id') id: string) {
    return this.hrService.getGuardProfile(id);
  }

  @Post('guards/:id/profile')
  @Roles('ADMIN','HR')
  upsertProfile(@Param('id') id: string, @Body() body: any) {
    return this.hrService.upsertGuardProfile(id, body);
  }

  @Patch('guards/:id/weapon-authorisation')
  @Roles('ADMIN','HR')
  updateWeaponAuth(@Param('id') id: string, @Body() body: { authorised: boolean }) {
    return this.hrService.updateWeaponAuthorisation(id, body.authorised);
  }

  @Get('weapon-authorisation')
  @Roles('ADMIN','CEO','HR','ARMOURY_OFFICER')
  getWeaponAuthRegistry() {
    return this.hrService.getWeaponAuthorisationRegistry();
  }

  @Get('leave-requests')
  @Roles('ADMIN','HR','OPS_MANAGER')
  getAllLeaveRequests(@Query('status') status?: string) {
    return this.hrService.getAllLeaveRequests(status);
  }

  @Post('leave-requests')
  createLeaveRequest(@Req() req: any, @Body() body: any) {
    return this.hrService.createLeaveRequest(req.user.id, body);
  }

  @Patch('leave-requests/:id/approve')
  @Roles('ADMIN','HR')
  approveLeave(@Param('id') id: string, @Req() req: any, @Body() body: { approved: boolean; rejectReason?: string }) {
    return this.hrService.approveLeaveRequest(id, req.user.id, body.approved, body.rejectReason);
  }
}
