import { Module } from '@nestjs/common';
import { ArmouryController } from './armoury.controller';
import { ArmouryService } from './armoury.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ArmouryController],
  providers: [ArmouryService],
  exports: [ArmouryService],
})
export class ArmouryModule {}
