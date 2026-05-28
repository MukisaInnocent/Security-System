import { Controller, Get, Post, Body, UseGuards, Request, Param, Put } from '@nestjs/common';
import { GuardChargesService } from './guard-charges.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('guard-charges')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GuardChargesController {
  constructor(private readonly guardChargesService: GuardChargesService) {}

  @Post()
  @Roles('SUPERVISOR', 'OPERATIONS_MANAGER', 'ADMIN')
  createCharge(@Request() req, @Body() body: { guardId: string; chargeDetails: string; amount: number; evidenceUrl?: string }) {
    return this.guardChargesService.createCharge(req.user.id, body);
  }

  @Get()
  @Roles('SUPERVISOR', 'OPERATIONS_MANAGER', 'ADMIN')
  getAllCharges() {
    return this.guardChargesService.getAllCharges();
  }

  @Get('my-charges')
  @Roles('GUARD')
  getMyCharges(@Request() req) {
    return this.guardChargesService.getChargesForGuard(req.user.id);
  }

  @Post(':id/confirm')
  @Roles('GUARD')
  confirmCharge(@Param('id') id: string, @Request() req, @Body('pin') pin: string) {
    return this.guardChargesService.confirmCharge(id, req.user.id, pin);
  }

  @Post(':id/void')
  @Roles('OPERATIONS_MANAGER', 'ADMIN')
  voidCharge(@Param('id') id: string, @Request() req) {
    return this.guardChargesService.voidCharge(id, req.user.id);
  }

  @Patch(':id/operations-status')
  @Roles('OPERATIONS_MANAGER', 'ADMIN')
  updateOperationsStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.guardChargesService.updateOperationsStatus(id, status);
  }
}
