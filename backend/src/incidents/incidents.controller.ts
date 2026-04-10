import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto, SyncIncidentsDto } from './dto/incident.dto';

@Controller('incidents')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class IncidentsController {
  constructor(private incidentsService: IncidentsService) {}

  @Post()
  @Roles('GUARD', 'SUPERVISOR', 'OPS_MANAGER', 'ADMIN')
  @UseInterceptors(
    FileInterceptor('media', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const randomName = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  create(
    @Body() dto: CreateIncidentDto,
    @CurrentUser('id') userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const mediaUrl = file ? `/uploads/${file.filename}` : undefined;
    return this.incidentsService.create(userId, dto, mediaUrl);
  }

  @Get()
  findAll(
    @Query('siteId') siteId?: string,
    @Query('severity') severity?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.incidentsService.findAll({ siteId, severity, status, dateFrom, dateTo });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id/assign')
  @Roles('SUPERVISOR', 'OPS_MANAGER', 'ADMIN')
  assignIncident(
    @Param('id') id: string,
    @Body('assignedToId') assignedToId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.incidentsService.assignIncident(id, assignedToId, userId);
  }

  @Patch(':id/resolve')
  @Roles('SUPERVISOR', 'OPS_MANAGER', 'ADMIN')
  resolveIncident(
    @Param('id') id: string,
    @Body('resolutionNote') resolutionNote: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.incidentsService.resolveIncident(id, userId, resolutionNote);
  }

  @Patch(':id/status')
  @Roles('SUPERVISOR', 'OPS_MANAGER', 'ADMIN')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.incidentsService.updateStatus(id, status, userId);
  }

  @Post('sync')
  @Roles('GUARD', 'SUPERVISOR')
  syncOffline(@Body() dto: SyncIncidentsDto, @CurrentUser('id') userId: string) {
    return this.incidentsService.syncOfflineRecords(userId, dto);
  }
}
