import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { RegionsService } from './regions.service';
import { CreateRegionDto, UpdateRegionDto } from './dto/region.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('regions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.regionsService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.regionsService.findOne(id);
  }

  @Get(':id/dashboard')
  getDashboard(@Param('id') id: string) {
    return this.regionsService.getDashboard(id);
  }

  @Post()
  @Roles('ADMIN', 'CEO')
  create(@Body() dto: CreateRegionDto, @Req() req: any) {
    return this.regionsService.create(dto, req.user.tenantId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'CEO')
  update(@Param('id') id: string, @Body() dto: UpdateRegionDto) {
    return this.regionsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'CEO')
  remove(@Param('id') id: string) {
    return this.regionsService.remove(id);
  }
}
