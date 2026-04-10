import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
import { CreateConversationDto, SendMessageDto, BroadcastDto } from './dto/chat.dto';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private chatService: ChatService) {}

  // GET /api/chat/conversations
  @Get('conversations')
  async getConversations(@Request() req: any) {
    return this.chatService.getConversations(req.user.id);
  }

  // POST /api/chat/conversations
  @Post('conversations')
  async createConversation(@Request() req: any, @Body() dto: CreateConversationDto) {
    if (dto.type === 'DIRECT' && dto.participantIds.length === 1) {
      return this.chatService.createDirectConversation(req.user.id, dto.participantIds[0]);
    }

    return this.chatService.createGroupConversation(
      req.user.id,
      dto.name || 'New Group',
      dto.participantIds,
      dto.type,
      {
        siteId: dto.siteId,
        incidentId: dto.incidentId,
        deploymentId: dto.deploymentId,
      },
    );
  }

  // GET /api/chat/conversations/:id
  @Get('conversations/:id')
  async getConversation(@Request() req: any, @Param('id') id: string) {
    return this.chatService.getConversation(id, req.user.id);
  }

  // GET /api/chat/conversations/:id/messages
  @Get('conversations/:id/messages')
  async getMessages(
    @Request() req: any,
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(id, req.user.id, cursor, limit ? parseInt(limit) : 50);
  }

  // POST /api/chat/conversations/:id/messages
  @Post('conversations/:id/messages')
  async sendMessage(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(
      id,
      req.user.id,
      dto.content,
      dto.messageType,
      dto.mediaUrl,
      dto.replyToId,
      dto.offlineId,
    );
  }

  // PATCH /api/chat/conversations/:id/read
  @Patch('conversations/:id/read')
  async markAsRead(@Request() req: any, @Param('id') id: string) {
    return this.chatService.markAsRead(id, req.user.id);
  }

  // GET /api/chat/unread-count
  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    return this.chatService.getUnreadCount(req.user.id);
  }

  // GET /api/chat/contacts
  @Get('contacts')
  async getContacts(@Request() req: any) {
    return this.chatService.getContacts(req.user.id);
  }

  // GET /api/chat/context/:type/:id
  @Get('context/:type/:id')
  async getContextualConversation(
    @Request() req: any,
    @Param('type') type: string,
    @Param('id') id: string,
  ) {
    return this.chatService.getContextualConversation(type.toUpperCase(), id, req.user.id);
  }

  // POST /api/chat/broadcast
  @Post('broadcast')
  async sendBroadcast(@Request() req: any, @Body() dto: BroadcastDto) {
    return this.chatService.createBroadcast(
      req.user.id,
      dto.name || 'Broadcast',
      dto.content,
      dto.targetRoles,
      dto.targetUserIds,
    );
  }
}
