import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ChangeSheetsService } from './change-sheets.service';

@Controller('change-sheets')
@UseGuards(AuthGuard('jwt'))
export class ChangeSheetsController {
  constructor(private service: ChangeSheetsService) {}

  @Post()
  async create(@Body() body: {
    guardId: string;
    changeType: string;
    reason: string;
    amount?: number;
    evidence?: string;
    mediaUrl?: string;
    serialOrBiometric?: string;
    previousValue?: string;
    newValue?: string;
  }) {
    return this.service.create(body);
  }

  @Get()
  async findAll(
    @Query('guardId') guardId?: string,
    @Query('status') status?: string,
    @Query('changeType') changeType?: string,
  ) {
    return this.service.findAll(guardId, status, changeType);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/approve')
  async approve(@Param('id') id: string, @Body() body: { approved: boolean }, @CurrentUser('id') userId: string) {
    return this.service.approve(id, userId, body.approved);
  }
}
