import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PersonnelMovementsService } from './personnel-movements.service';

@Controller('personnel-movements')
@UseGuards(AuthGuard('jwt'))
export class PersonnelMovementsController {
  constructor(private service: PersonnelMovementsService) {}

  @Post()
  async create(@Body() body: {
    guardId: string;
    movementType: string;
    fromSiteId?: string;
    toSiteId?: string;
    reason: string;
    effectiveDate: string;
    notes?: string;
  }) {
    return this.service.create(body);
  }

  @Get()
  async findAll(
    @Query('guardId') guardId?: string,
    @Query('status') status?: string,
    @Query('type') movementType?: string,
  ) {
    return this.service.findAll(guardId, status, movementType);
  }

  @Patch(':id/approve')
  async approve(@Param('id') id: string, @Body() body: { approved: boolean }, @CurrentUser('id') userId: string) {
    return this.service.approve(id, userId, body.approved);
  }

  @Patch(':id/complete')
  async complete(@Param('id') id: string) {
    return this.service.complete(id);
  }
}
