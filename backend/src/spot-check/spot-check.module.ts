import { Module } from '@nestjs/common';
import { SpotCheckController } from './spot-check.controller';
import { SpotCheckService } from './spot-check.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SpotCheckController],
  providers: [SpotCheckService],
  exports: [SpotCheckService],
})
export class SpotCheckModule {}
