import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';

export class CreateDeploymentDto {
  @IsString()
  guardId: string;

  @IsString()
  siteId: string;

  @IsString()
  shiftStart: string; // HH:mm

  @IsString()
  shiftEnd: string; // HH:mm

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDeploymentDto {
  @IsOptional()
  @IsString()
  shiftStart?: string;

  @IsOptional()
  @IsString()
  shiftEnd?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
