import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckInDto {
  @IsString()
  siteId: string;

  @IsOptional()
  @IsString()
  deploymentId?: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsBoolean()
  syncedFromOffline?: boolean;

  @IsOptional()
  @IsString()
  offlineId?: string;

  @IsOptional()
  @IsString()
  timestamp?: string; // ISO string for offline records
}

export class CheckOutDto {
  @IsString()
  siteId: string;

  @IsOptional()
  @IsString()
  deploymentId?: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsBoolean()
  syncedFromOffline?: boolean;

  @IsOptional()
  @IsString()
  offlineId?: string;

  @IsOptional()
  @IsString()
  timestamp?: string;
}

export class SyncAttendanceRecordDto {
  @IsString()
  offlineId: string;

  @IsString()
  siteId: string;

  @IsOptional()
  @IsString()
  deploymentId?: string;

  @IsEnum(['CHECK_IN', 'CHECK_OUT'])
  type: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsString()
  timestamp: string;
}

export class SyncAttendanceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncAttendanceRecordDto)
  records: SyncAttendanceRecordDto[];
}
