import { Module } from '@nestjs/common';
import { PersonnelMovementsService } from './personnel-movements.service';
import { PersonnelMovementsController } from './personnel-movements.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PersonnelMovementsController],
  providers: [PersonnelMovementsService],
})
export class PersonnelMovementsModule {}
