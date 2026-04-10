import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { FoodSupplierService } from './food-supplier.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('food-supplier')
@UseGuards(JwtAuthGuard)
export class FoodSupplierController {
  constructor(private readonly foodSupplierService: FoodSupplierService) {}

  @Get('headcount')
  getHeadcount(@Query('siteId') siteId: string, @Req() req: any) {
    return this.foodSupplierService.getHeadcount(siteId, req.user.id);
  }

  @Post('session/start')
  startSession(@Body() body: { siteId: string }, @Req() req: any) {
    return this.foodSupplierService.startMealSession(body.siteId, req.user.id);
  }

  @Post('session/:id/verify')
  verifyGuard(@Param('id') id: string, @Body() body: { biometricPin: string }, @Req() req: any) {
    return this.foodSupplierService.verifyGuardMeal(id, body.biometricPin, req.user.id);
  }

  @Patch('session/:id/end')
  endSession(@Param('id') id: string, @Req() req: any) {
    return this.foodSupplierService.endMealSession(id, req.user.id);
  }

  @Get('deliveries')
  getDeliveries(@Req() req: any) {
    return this.foodSupplierService.getDeliveries(req.user.id);
  }

  @Get('reports/meal-cost')
  getMealCostReport(@Query('siteId') siteId?: string, @Query('month') month?: string, @Query('year') year?: string) {
    return this.foodSupplierService.getMealCostReport(siteId, month ? +month : undefined, year ? +year : undefined);
  }
}
