import { Module } from '@nestjs/common';
import { SpecialDutyController } from './special-duty.controller';
import { SpecialDutyService } from './special-duty.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SpecialDutyController],
  providers: [SpecialDutyService],
  exports: [SpecialDutyService],
})
export class SpecialDutyModule {}
