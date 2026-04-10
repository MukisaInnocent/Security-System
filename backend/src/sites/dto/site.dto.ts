import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateSiteDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  geofenceRadius?: number;
}

export class UpdateSiteDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  geofenceRadius?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
