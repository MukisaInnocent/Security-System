import { IsString, IsOptional, IsBoolean, IsInt, IsIn } from 'class-validator';

export class CreatePostDto {
  @IsString() name: string;
  @IsString() siteId: string;
  @IsOptional() @IsIn(['DAY','NIGHT','BOTH']) shiftType?: string;
  @IsOptional() @IsInt() guardsRequired?: number;
  @IsOptional() @IsBoolean() weaponRequired?: boolean;
  @IsOptional() @IsString() instructions?: string;
}

export class UpdatePostDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsIn(['DAY','NIGHT','BOTH']) shiftType?: string;
  @IsOptional() @IsInt() guardsRequired?: number;
  @IsOptional() @IsBoolean() weaponRequired?: boolean;
  @IsOptional() @IsString() instructions?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
