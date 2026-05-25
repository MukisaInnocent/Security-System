import { Module } from '@nestjs/common';
import { ChangeSheetsService } from './change-sheets.service';
import { ChangeSheetsController } from './change-sheets.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChangeSheetsController],
  providers: [ChangeSheetsService],
})
export class ChangeSheetsModule {}
