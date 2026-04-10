import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ArmouryService } from './armoury.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('armoury')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ArmouryController {
  constructor(private readonly armouryService: ArmouryService) {}

  // Weapons
  @Get('weapons')
  @Roles('ADMIN','CEO','ARMOURY_OFFICER','OPS_MANAGER')
  findAllWeapons(@Query('status') status?: string) {
    return this.armouryService.findAllWeapons(status);
  }

  @Get('weapons/:id')
  @Roles('ADMIN','CEO','ARMOURY_OFFICER')
  findWeapon(@Param('id') id: string) {
    return this.armouryService.findWeapon(id);
  }

  @Post('weapons')
  @Roles('ADMIN','ARMOURY_OFFICER')
  createWeapon(@Body() body: any) {
    return this.armouryService.createWeapon(body);
  }

  @Patch('weapons/:id')
  @Roles('ADMIN','ARMOURY_OFFICER')
  updateWeapon(@Param('id') id: string, @Body() body: any) {
    return this.armouryService.updateWeapon(id, body);
  }

  // Issuances
  @Get('issuances')
  @Roles('ADMIN','CEO','ARMOURY_OFFICER','OPS_MANAGER','SUPERVISOR')
  findAllIssuances(@Query('siteId') siteId?: string, @Query('guardId') guardId?: string, @Query('isReturned') isReturned?: string) {
    return this.armouryService.findAllIssuances(siteId, guardId, isReturned === 'false' ? false : isReturned === 'true' ? true : undefined);
  }

  @Post('issuances')
  @Roles('ADMIN','ARMOURY_OFFICER','SUPERVISOR')
  createIssuance(@Body() body: any, @Req() req: any) {
    return this.armouryService.createIssuance(body, req.user.id);
  }

  @Patch('issuances/:id/return')
  @Roles('ADMIN','ARMOURY_OFFICER')
  returnWeapon(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.armouryService.returnWeapon(id, body, req.user.id);
  }

  // Ammunition
  @Get('ammunition')
  @Roles('ADMIN','CEO','ARMOURY_OFFICER')
  getAmmunitionStock(@Query('siteId') siteId?: string) {
    return this.armouryService.getAmmunitionStock(siteId);
  }

  @Post('ammunition')
  @Roles('ADMIN','ARMOURY_OFFICER')
  updateAmmunitionStock(@Body() body: any) {
    return this.armouryService.updateAmmunitionStock(body);
  }

  // Reports
  @Get('reports/issuances')
  @Roles('ADMIN','CEO','ARMOURY_OFFICER')
  getIssuancesReport(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.armouryService.getWeaponsIssuedReport(startDate, endDate);
  }

  @Get('reports/licence-expiry')
  @Roles('ADMIN','CEO','ARMOURY_OFFICER')
  getLicenceExpiry() {
    return this.armouryService.getLicenceExpiryReport();
  }
}
