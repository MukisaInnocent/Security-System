import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { SpotCheckService } from './spot-check.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('spot-check')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SpotCheckController {
  constructor(private readonly spotCheckService: SpotCheckService) {}

  @Get('active-guards')
  getActiveGuards(@Query('siteId') siteId: string, @Req() req: any) {
    return this.spotCheckService.getActiveGuardsForSpotCheck(siteId, req.user.id, req.user.role);
  }

  @Get()
  getSpotChecks(@Query('siteId') siteId?: string, @Query('guardId') guardId?: string) {
    return this.spotCheckService.getSpotChecks(siteId, guardId);
  }

  @Post()
  performSpotCheck(@Body() body: any, @Req() req: any) {
    return this.spotCheckService.performSpotCheck(body, req.user.id);
  }

  @Post('charges')
  raiseChargeFromBody(@Body() body: any, @Req() req: any) {
    return this.spotCheckService.raiseCharge(body.spotCheckId, body, req.user.id);
  }

  @Post(':id/charge')
  raiseCharge(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.spotCheckService.raiseCharge(id, body, req.user.id);
  }

  @Get('charges')
  getAllCharges(@Query('guardId') guardId?: string, @Query('status') status?: string) {
    return this.spotCheckService.getAllCharges(guardId, status);
  }

  @Patch('charges/:id/status')
  @Roles('ADMIN','HR')
  updateChargeStatus(@Param('id') id: string, @Body() body: { status: string; statusNotes: string }) {
    return this.spotCheckService.updateChargeStatus(id, body.status, body.statusNotes);
  }

  @Post('void')
  initiateVoid(@Body() body: any, @Req() req: any) {
    return this.spotCheckService.initiateVoid(body, req.user.id, req.user.role);
  }

  @Patch('void/:id/approve')
  @Roles('ADMIN','CEO','REGIONAL_MANAGER','OPS_MANAGER')
  approveVoid(@Param('id') id: string, @Body() body: { approved: boolean; decisionNote?: string }, @Req() req: any) {
    return this.spotCheckService.approveVoid(id, req.user.id, body.approved, body.decisionNote);
  }
}
