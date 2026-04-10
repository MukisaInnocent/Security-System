import { Module } from '@nestjs/common';
import { FoodSupplierController } from './food-supplier.controller';
import { FoodSupplierService } from './food-supplier.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FoodSupplierController],
  providers: [FoodSupplierService],
  exports: [FoodSupplierService],
})
export class FoodSupplierModule {}
