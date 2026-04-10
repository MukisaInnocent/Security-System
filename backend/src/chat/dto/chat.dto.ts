import { IsString, IsOptional, IsArray, IsEnum, IsUUID, IsInt, Min } from 'class-validator';

export enum ConversationType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
  SITE = 'SITE',
  INCIDENT = 'INCIDENT',
  DEPLOYMENT = 'DEPLOYMENT',
  BROADCAST = 'BROADCAST',
}

export class CreateConversationDto {
  @IsEnum(ConversationType)
  type: ConversationType;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  participantIds: string[];

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsString()
  incidentId?: string;

  @IsOptional()
  @IsString()
  deploymentId?: string;
}

export class SendMessageDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  messageType?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  replyToId?: string;

  @IsOptional()
  @IsString()
  offlineId?: string;
}

export class BroadcastDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetRoles?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetUserIds?: string[];
}
