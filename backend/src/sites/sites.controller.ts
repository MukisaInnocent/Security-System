import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SitesService } from './sites.service';
import { CreateSiteDto, UpdateSiteDto } from './dto/site.dto';

@Controller('sites')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SitesController {
  constructor(private sitesService: SitesService) {}

  @Get()
  findAll() {
    return this.sitesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sitesService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'OPS_MANAGER')
  create(@Body() dto: CreateSiteDto, @CurrentUser('id') userId: string) {
    return this.sitesService.create(dto, userId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'OPS_MANAGER')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSiteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.sitesService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.sitesService.remove(id, userId);
  }
}
