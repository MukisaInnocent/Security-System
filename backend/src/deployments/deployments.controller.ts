import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DeploymentsService } from './deployments.service';
import { CreateDeploymentDto, UpdateDeploymentDto } from './dto/deployment.dto';

@Controller('deployments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DeploymentsController {
  constructor(private deploymentsService: DeploymentsService) {}

  @Get()
  findAll(
    @Query('date') date?: string,
    @Query('siteId') siteId?: string,
    @Query('guardId') guardId?: string,
    @Query('status') status?: string,
  ) {
    return this.deploymentsService.findAll({ date, siteId, guardId, status });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deploymentsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'OPS_MANAGER', 'SUPERVISOR')
  create(@Body() dto: CreateDeploymentDto, @CurrentUser('id') userId: string) {
    return this.deploymentsService.create(dto, userId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'OPS_MANAGER', 'SUPERVISOR')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDeploymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.deploymentsService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles('ADMIN', 'OPS_MANAGER')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.deploymentsService.remove(id, userId);
  }
}
