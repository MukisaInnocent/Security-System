import { IsString, IsOptional, IsEnum, IsNumber, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateIncidentDto {
  @IsString()
  siteId: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  severity?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

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

export class SyncIncidentRecordDto {
  @IsString()
  offlineId: string;

  @IsString()
  siteId: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  severity?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsString()
  timestamp: string;
}

export class SyncIncidentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncIncidentRecordDto)
  records: SyncIncidentRecordDto[];
}
