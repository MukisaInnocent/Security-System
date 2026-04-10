import { IsString, IsOptional, IsBoolean, IsInt, IsIn, IsDateString, IsNumber } from 'class-validator';

export class CreateWeaponDto {
  @IsString() serialNumber: string;
  @IsString() weaponType: string;
  @IsOptional() @IsString() make?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsString() primarySiteId?: string;
  @IsOptional() @IsString() licenceNumber?: string;
  @IsOptional() @IsDateString() licenceExpiry?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateWeaponDto {
  @IsOptional() @IsIn(['AVAILABLE','ISSUED','UNDER_MAINTENANCE','DECOMMISSIONED']) status?: string;
  @IsOptional() @IsString() primarySiteId?: string;
  @IsOptional() @IsString() licenceNumber?: string;
  @IsOptional() @IsDateString() licenceExpiry?: string;
  @IsOptional() @IsString() notes?: string;
}

export class CreateIssuanceDto {
  @IsString() weaponId: string;
  @IsString() guardId: string;
  @IsString() siteId: string;
  @IsOptional() @IsString() deploymentId?: string;
  @IsString() shiftType: string;
  @IsOptional() @IsInt() roundsIssued?: number;
}

export class ReturnWeaponDto {
  @IsIn(['GOOD','REQUIRES_INSPECTION','DAMAGED']) returnCondition: string;
  @IsOptional() @IsInt() roundsReturned?: number;
}

export class UpdateAmmunitionDto {
  @IsString() siteId: string;
  @IsString() calibre: string;
  @IsString() type: string;
  @IsInt() quantity: number;
  @IsOptional() @IsInt() minStock?: number;
}
