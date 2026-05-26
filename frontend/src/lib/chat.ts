'use client';

import { io, Socket } from 'socket.io-client';

const getChatBase = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:3001';
};

const API_BASE = getChatBase();

let socket: Socket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: string;
  mediaUrl?: string;
  replyToId?: string;
  offlineId?: string;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  sender?: { id: string; name: string; role: string; profileImg?: string };
  readReceipts?: { userId: string; readAt: string }[];
}

export interface ChatConversation {
  id: string;
  type: string;
  name?: string;
  description?: string;
  createdById: string;
  siteId?: string;
  incidentId?: string;
  deploymentId?: string;
  isActive: boolean;
  lastMessageAt?: string;
  createdAt: string;
  unreadCount?: number;
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
    messageType?: string;
  };
  participantUsers?: { id: string; name: string; role: string; profileImg?: string }[];
  participants?: { userId: string; role: string }[];
}

type MessageHandler = (msg: ChatMessage) => void;
type TypingHandler = (data: { conversationId: string; userId: string; isTyping: boolean }) => void;
type ReadHandler = (data: { conversationId: string; userId: string; messageIds: string[]; readAt: string }) => void;
type UpdateHandler = (data: { conversationId: string; lastMessage: any }) => void;

const messageHandlers: Set<MessageHandler> = new Set();
const typingHandlers: Set<TypingHandler> = new Set();
const readHandlers: Set<ReadHandler> = new Set();
const updateHandlers: Set<UpdateHandler> = new Set();

export function connectChat(token: string) {
  if (socket?.connected) return;

  socket = io(`${API_BASE}/chat`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('💬 Chat connected');
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('💬 Chat disconnected:', reason);
  });

  socket.on('new_message', (msg: ChatMessage) => {
    messageHandlers.forEach((h) => h(msg));
  });

  socket.on('user_typing', (data: any) => {
    typingHandlers.forEach((h) => h(data));
  });

  socket.on('message_read', (data: any) => {
    readHandlers.forEach((h) => h(data));
  });

  socket.on('conversation_updated', (data: any) => {
    updateHandlers.forEach((h) => h(data));
  });

  socket.on('connect_error', (err) => {
    console.log('💬 Chat connection error:', err.message);
  });
}

export function disconnectChat() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinConversation(conversationId: string) {
  socket?.emit('join_conversation', { conversationId });
}

export function leaveConversation(conversationId: string) {
  socket?.emit('leave_conversation', { conversationId });
}

export function sendMessageWs(data: {
  conversationId: string;
  content: string;
  messageType?: string;
  mediaUrl?: string;
  replyToId?: string;
  offlineId?: string;
}) {
  socket?.emit('send_message', data);
}

export function emitTyping(conversationId: string, isTyping: boolean) {
  socket?.emit('typing', { conversationId, isTyping });
}

export function markReadWs(conversationId: string) {
  socket?.emit('mark_read', { conversationId });
}

export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

// ─── Event subscription ───────────────────────────────────────
export function onNewMessage(handler: MessageHandler) {
  messageHandlers.add(handler);
  return () => messageHandlers.delete(handler);
}

export function onTyping(handler: TypingHandler) {
  typingHandlers.add(handler);
  return () => typingHandlers.delete(handler);
}

export function onReadReceipt(handler: ReadHandler) {
  readHandlers.add(handler);
  return () => readHandlers.delete(handler);
}

export function onConversationUpdated(handler: UpdateHandler) {
  updateHandlers.add(handler);
  return () => updateHandlers.delete(handler);
}
