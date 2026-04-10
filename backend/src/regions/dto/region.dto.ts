import { IsString, IsOptional } from 'class-validator';

export class CreateRegionDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() managerId?: string;
}

export class UpdateRegionDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() managerId?: string;
}
