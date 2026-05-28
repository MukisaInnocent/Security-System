import { Module } from '@nestjs/common';
import { GuardChargesService } from './guard-charges.service';
import { GuardChargesController } from './guard-charges.controller';

@Module({
  providers: [GuardChargesService],
  controllers: [GuardChargesController]
})
export class GuardChargesModule {}
