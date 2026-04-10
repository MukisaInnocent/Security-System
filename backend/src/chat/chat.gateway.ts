import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map userId -> Set of socket IDs
  private userSockets = new Map<string, Set<string>>();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  // ─── Connection lifecycle ─────────────────────────────────────
  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        (client.handshake.headers.authorization?.replace('Bearer ', '') ?? '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'super-secret-change-me',
      });

      const userId = payload.sub;
      (client as any).userId = userId;

      // Track socket
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)?.add(client.id);

      // Join user's personal room
      client.join(`user:${userId}`);

      console.log(`💬 Chat: User ${userId} connected (socket: ${client.id})`);
    } catch (err) {
      console.log('💬 Chat: Auth failed, disconnecting socket');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    if (userId) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
      console.log(`💬 Chat: User ${userId} disconnected`);
    }
  }

  // ─── Join a conversation room ─────────────────────────────────
  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = (client as any).userId;
    if (!userId) return;

    try {
      // Verify participant
      await this.chatService.getConversation(data.conversationId, userId);
      client.join(`conv:${data.conversationId}`);
      return { event: 'joined', data: { conversationId: data.conversationId } };
    } catch {
      return { event: 'error', data: { message: 'Cannot join conversation' } };
    }
  }

  // ─── Leave a conversation room ────────────────────────────────
  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conv:${data.conversationId}`);
    return { event: 'left', data: { conversationId: data.conversationId } };
  }

  // ─── Send message via WebSocket ───────────────────────────────
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: string;
      content: string;
      messageType?: string;
      mediaUrl?: string;
      replyToId?: string;
      offlineId?: string;
    },
  ) {
    const userId = (client as any).userId;
    if (!userId) return;

    try {
      const message = await this.chatService.sendMessage(
        data.conversationId,
        userId,
        data.content,
        data.messageType,
        data.mediaUrl,
        data.replyToId,
        data.offlineId,
      );

      // Broadcast to conversation room
      this.server.to(`conv:${data.conversationId}`).emit('new_message', message);

      // Also notify all participants' personal rooms (for unread badge updates)
      const participantIds = (message as any).participantIds || [];
      participantIds.forEach((pid: string) => {
        if (pid !== userId) {
          this.server.to(`user:${pid}`).emit('conversation_updated', {
            conversationId: data.conversationId,
            lastMessage: {
              content: message.content,
              senderId: message.senderId,
              createdAt: message.createdAt,
            },
          });
        }
      });

      return { event: 'message_sent', data: message };
    } catch (err: any) {
      return { event: 'error', data: { message: err.message || 'Failed to send message' } };
    }
  }

  // ─── Typing indicator ─────────────────────────────────────────
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    const userId = (client as any).userId;
    if (!userId) return;

    client.to(`conv:${data.conversationId}`).emit('user_typing', {
      conversationId: data.conversationId,
      userId,
      isTyping: data.isTyping,
    });
  }

  // ─── Mark messages as read ────────────────────────────────────
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = (client as any).userId;
    if (!userId) return;

    try {
      const result = await this.chatService.markAsRead(data.conversationId, userId);

      // Emit read receipts to conversation room
      if (result.marked > 0) {
        this.server.to(`conv:${data.conversationId}`).emit('message_read', {
          conversationId: data.conversationId,
          userId,
          messageIds: result.messageIds,
          readAt: new Date().toISOString(),
        });
      }

      return { event: 'marked_read', data: result };
    } catch {
      return { event: 'error', data: { message: 'Failed to mark as read' } };
    }
  }

  // ─── Utility: emit to specific user ───────────────────────────
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
