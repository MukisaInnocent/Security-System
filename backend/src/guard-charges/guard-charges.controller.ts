import { Controller, Get, Post, Body, UseGuards, Request, Param, Put, Patch } from '@nestjs/common';
import { GuardChargesService } from './guard-charges.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('guard-charges')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GuardChargesController {
  constructor(private readonly guardChargesService: GuardChargesService) {}

  @Post()
  @Roles('SUPERVISOR', 'OPERATIONS_MANAGER', 'ADMIN')
  createCharge(@Request() req: any, @Body() body: { guardId: string; chargeCategory: string; chargeDescription: string; severityLevel: string; amount: number; evidenceUrl?: string }) {
    return this.guardChargesService.createCharge(req.user.id, body);
  }

  @Get()
  @Roles('SUPERVISOR', 'OPERATIONS_MANAGER', 'ADMIN')
  getAllCharges() {
    return this.guardChargesService.getAllCharges();
  }

  @Get('my-charges')
  @Roles('GUARD')
  getMyCharges(@Request() req: any) {
    return this.guardChargesService.getChargesForGuard(req.user.id);
  }

  @Post(':id/confirm')
  @Roles('GUARD')
  confirmCharge(@Param('id') id: string, @Request() req: any, @Body('pin') pin: string) {
    return this.guardChargesService.confirmCharge(id, req.user.id, pin);
  }

  @Post(':id/void')
  @Roles('OPERATIONS_MANAGER', 'ADMIN')
  voidCharge(@Param('id') id: string, @Request() req: any) {
    return this.guardChargesService.voidCharge(id, req.user.id);
  }

  @Patch(':id/operations-status')
  @Roles('OPERATIONS_MANAGER', 'ADMIN')
  updateOperationsStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.guardChargesService.updateOperationsStatus(id, status);
  }
}
