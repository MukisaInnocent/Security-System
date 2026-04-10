import {
  Controller, Get, Post, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AttendanceService } from './attendance.service';
import { CheckInDto, CheckOutDto, SyncAttendanceDto } from './dto/attendance.dto';

@Controller('attendance')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('check-in')
  @Roles('GUARD', 'SUPERVISOR')
  checkIn(@Body() dto: CheckInDto, @CurrentUser('id') guardId: string) {
    return this.attendanceService.checkIn(guardId, dto);
  }

  @Post('check-out')
  @Roles('GUARD', 'SUPERVISOR')
  checkOut(@Body() dto: CheckOutDto, @CurrentUser('id') guardId: string) {
    return this.attendanceService.checkOut(guardId, dto);
  }

  @Post('sync')
  @Roles('GUARD', 'SUPERVISOR')
  syncOffline(@Body() dto: SyncAttendanceDto, @CurrentUser('id') guardId: string) {
    return this.attendanceService.syncOfflineRecords(guardId, dto);
  }

  @Get()
  @Roles('ADMIN', 'OPS_MANAGER', 'SUPERVISOR', 'CLIENT')
  findAll(
    @Query('guardId') guardId?: string,
    @Query('siteId') siteId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('type') type?: string,
  ) {
    return this.attendanceService.findAll({ guardId, siteId, dateFrom, dateTo, type });
  }
}
