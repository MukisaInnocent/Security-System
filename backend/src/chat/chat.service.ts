import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationType } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  // ─── Permission matrix ────────────────────────────────────────
  private readonly CONTACT_RULES: Record<string, string[]> = {
    GUARD: ['SUPERVISOR', 'ADMIN', 'CEO', 'OPS_MANAGER'],
    SUPERVISOR: ['GUARD', 'ADMIN', 'CEO', 'OPS_MANAGER', 'SUPERVISOR', 'HR'],
    ADMIN: ['GUARD', 'SUPERVISOR', 'ADMIN', 'CEO', 'OPS_MANAGER', 'CLIENT', 'HR', 'M_AND_E', 'REGIONAL_MANAGER', 'FINANCE', 'ARMOURY_OFFICER', 'PROCUREMENT_OFFICER', 'LOGISTICS_OFFICER', 'FOOD_SUPPLIER'],
    CEO: ['GUARD', 'SUPERVISOR', 'ADMIN', 'CEO', 'OPS_MANAGER', 'CLIENT', 'HR', 'M_AND_E', 'REGIONAL_MANAGER', 'FINANCE', 'ARMOURY_OFFICER', 'PROCUREMENT_OFFICER', 'LOGISTICS_OFFICER', 'FOOD_SUPPLIER'],
    OPS_MANAGER: ['GUARD', 'SUPERVISOR', 'ADMIN', 'CEO', 'OPS_MANAGER', 'HR', 'M_AND_E', 'REGIONAL_MANAGER'],
    CLIENT: ['ADMIN', 'CEO', 'OPS_MANAGER', 'SUPERVISOR'],
    HR: ['ADMIN', 'CEO', 'OPS_MANAGER', 'SUPERVISOR', 'HR', 'GUARD'],
    M_AND_E: ['ADMIN', 'CEO', 'OPS_MANAGER', 'SUPERVISOR', 'M_AND_E'],
    REGIONAL_MANAGER: ['ADMIN', 'CEO', 'OPS_MANAGER', 'SUPERVISOR', 'REGIONAL_MANAGER', 'GUARD'],
    FINANCE: ['ADMIN', 'CEO', 'FINANCE'],
    ARMOURY_OFFICER: ['ADMIN', 'CEO', 'ARMOURY_OFFICER', 'SUPERVISOR'],
    PROCUREMENT_OFFICER: ['ADMIN', 'CEO', 'PROCUREMENT_OFFICER'],
    LOGISTICS_OFFICER: ['ADMIN', 'CEO', 'LOGISTICS_OFFICER'],
    FOOD_SUPPLIER: ['ADMIN', 'CEO'],
  };

  canContact(senderRole: string, targetRole: string): boolean {
    const allowed = this.CONTACT_RULES[senderRole];
    return allowed ? allowed.includes(targetRole) : false;
  }

  // ─── Get contactable users ────────────────────────────────────
  async getContacts(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const allowedRoles = this.CONTACT_RULES[user.role] || [];

    const contacts = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
        role: { in: allowedRoles },
        isActive: true,
      },
      select: { id: true, name: true, role: true, profileImg: true },
      orderBy: { name: 'asc' },
    });

    return contacts;
  }

  // ─── Create direct conversation ───────────────────────────────
  async createDirectConversation(userId: string, targetUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user || !target) throw new NotFoundException('User not found');

    if (!this.canContact(user.role, target.role)) {
      throw new ForbiddenException('You are not permitted to message this user');
    }

    // Check if DM already exists between these two users
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        isActive: true,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        participants: {
          include: { conversation: false },
        },
      },
    });

    if (existing) {
      // Return existing with participant user info
      const participantUsers = await this.prisma.user.findMany({
        where: { id: { in: existing.participants.map((p) => p.userId) } },
        select: { id: true, name: true, role: true, profileImg: true },
      });
      return { ...existing, participantUsers };
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        type: 'DIRECT',
        createdById: userId,
        participants: {
          create: [
            { userId, role: 'MEMBER' },
            { userId: targetUserId, role: 'MEMBER' },
          ],
        },
      },
      include: { participants: true },
    });

    const participantUsers = await this.prisma.user.findMany({
      where: { id: { in: [userId, targetUserId] } },
      select: { id: true, name: true, role: true, profileImg: true },
    });

    return { ...conversation, participantUsers };
  }

  // ─── Create group/contextual conversation ─────────────────────
  async createGroupConversation(
    createdById: string,
    name: string,
    participantIds: string[],
    type: ConversationType,
    contextId?: { siteId?: string; incidentId?: string; deploymentId?: string },
  ) {
    const allParticipantIds = [...new Set([createdById, ...participantIds])];

    const conversation = await this.prisma.conversation.create({
      data: {
        type,
        name,
        createdById,
        siteId: contextId?.siteId,
        incidentId: contextId?.incidentId,
        deploymentId: contextId?.deploymentId,
        participants: {
          create: allParticipantIds.map((uid) => ({
            userId: uid,
            role: uid === createdById ? 'ADMIN' : 'MEMBER',
          })),
        },
      },
      include: { participants: true },
    });

    // Auto-create system message
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: createdById,
        content: `Group "${name}" created`,
        messageType: 'SYSTEM',
      },
    });

    return conversation;
  }

  // ─── Send broadcast ───────────────────────────────────────────
  async createBroadcast(
    senderId: string,
    name: string,
    content: string,
    targetRoles?: string[],
    targetUserIds?: string[],
  ) {
    const sender = await this.prisma.user.findUnique({ where: { id: senderId } });
    if (!sender) throw new NotFoundException('Sender not found');

    const allowedBroadcasters = ['ADMIN', 'CEO', 'OPS_MANAGER', 'SUPERVISOR'];
    if (!allowedBroadcasters.includes(sender.role)) {
      throw new ForbiddenException('Only admins and supervisors can send broadcasts');
    }

    // Determine target users
    let targetUsers: { id: string }[] = [];
    if (targetUserIds?.length) {
      targetUsers = await this.prisma.user.findMany({
        where: { id: { in: targetUserIds }, isActive: true },
        select: { id: true },
      });
    } else if (targetRoles?.length) {
      targetUsers = await this.prisma.user.findMany({
        where: { role: { in: targetRoles }, isActive: true, id: { not: senderId } },
        select: { id: true },
      });
    } else {
      // All active users
      targetUsers = await this.prisma.user.findMany({
        where: { isActive: true, id: { not: senderId } },
        select: { id: true },
      });
    }

    const allParticipantIds = [senderId, ...targetUsers.map((u) => u.id)];

    const conversation = await this.prisma.conversation.create({
      data: {
        type: 'BROADCAST',
        name: name || 'Broadcast',
        createdById: senderId,
        lastMessageAt: new Date(),
        participants: {
          create: allParticipantIds.map((uid) => ({
            userId: uid,
            role: uid === senderId ? 'ADMIN' : 'MEMBER',
          })),
        },
        messages: {
          create: {
            senderId,
            content,
            messageType: 'TEXT',
          },
        },
      },
      include: { participants: true, messages: true },
    });

    return conversation;
  }

  // ─── Get conversations for user ───────────────────────────────
  async getConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        isActive: true,
        participants: { some: { userId, leftAt: null } },
      },
      include: {
        participants: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            senderId: true,
            messageType: true,
            createdAt: true,
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    // Enrich with unread counts and participant user info
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            readReceipts: { none: { userId } },
          },
        });

        const participantUsers = await this.prisma.user.findMany({
          where: { id: { in: conv.participants.map((p) => p.userId) } },
          select: { id: true, name: true, role: true, profileImg: true },
        });

        return {
          ...conv,
          unreadCount,
          participantUsers,
          lastMessage: conv.messages[0] || null,
        };
      }),
    );

    return enriched;
  }

  // ─── Get messages for a conversation ──────────────────────────
  async getMessages(conversationId: string, userId: string, cursor?: string, limit = 50) {
    // Verify user is participant
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw new ForbiddenException('You are not a member of this conversation');

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        readReceipts: {
          select: { userId: true, readAt: true },
        },
      },
    });

    // Get sender info for all messages
    const senderIds = [...new Set(messages.map((m) => m.senderId))];
    const senders = await this.prisma.user.findMany({
      where: { id: { in: senderIds } },
      select: { id: true, name: true, role: true, profileImg: true },
    });
    const senderMap = Object.fromEntries(senders.map((s) => [s.id, s]));

    return messages.reverse().map((m) => ({
      ...m,
      sender: senderMap[m.senderId] || { id: m.senderId, name: 'Unknown', role: 'UNKNOWN' },
    }));
  }

  // ─── Send message ─────────────────────────────────────────────
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType = 'TEXT',
    mediaUrl?: string,
    replyToId?: string,
    offlineId?: string,
  ) {
    // If offlineId is provided, check if message already sent
    if (offlineId) {
      const existing = await this.prisma.message.findFirst({
        where: { offlineId, conversationId },
      });
      if (existing) return existing;
    }

    // Verify sender is participant
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: senderId } },
    });
    if (!participant) throw new ForbiddenException('You are not a member of this conversation');

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        messageType,
        mediaUrl,
        replyToId,
        offlineId,
      },
    });

    // Update conversation's lastMessageAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt },
    });

    // Get sender info
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { id: true, name: true, role: true, profileImg: true },
    });

    // Get all participant IDs for notification
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId, leftAt: null },
      select: { userId: true },
    });

    return {
      ...message,
      sender,
      participantIds: participants.map((p) => p.userId),
    };
  }

  // ─── Mark messages as read ────────────────────────────────────
  async markAsRead(conversationId: string, userId: string) {
    const unreadMessages = await this.prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readReceipts: { none: { userId } },
      },
      select: { id: true },
    });

    if (unreadMessages.length === 0) return { marked: 0 };

    await this.prisma.messageReadStatus.createMany({
      data: unreadMessages.map((m) => ({
        messageId: m.id,
        userId,
      })),
      skipDuplicates: true,
    });

    return { marked: unreadMessages.length, messageIds: unreadMessages.map((m) => m.id) };
  }

  // ─── Total unread message count ───────────────────────────────
  async getUnreadCount(userId: string) {
    const count = await this.prisma.message.count({
      where: {
        conversation: {
          isActive: true,
          participants: { some: { userId, leftAt: null } },
        },
        senderId: { not: userId },
        readReceipts: { none: { userId } },
      },
    });
    return { count };
  }

  // ─── Get or create contextual conversation ────────────────────
  async getContextualConversation(type: string, contextId: string, userId: string) {
    const contextField =
      type === 'INCIDENT'
        ? 'incidentId'
        : type === 'DEPLOYMENT'
          ? 'deploymentId'
          : type === 'SITE'
            ? 'siteId'
            : null;

    if (!contextField) throw new NotFoundException('Invalid context type');

    // Find existing
    const existing = await this.prisma.conversation.findFirst({
      where: { type, [contextField]: contextId, isActive: true },
      include: {
        participants: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (existing) {
      // Add user as participant if not already
      const isParticipant = existing.participants.some((p) => p.userId === userId);
      if (!isParticipant) {
        await this.prisma.conversationParticipant.create({
          data: { conversationId: existing.id, userId },
        });
      }

      const participantUsers = await this.prisma.user.findMany({
        where: { id: { in: existing.participants.map((p) => p.userId) } },
        select: { id: true, name: true, role: true, profileImg: true },
      });

      return { ...existing, participantUsers };
    }

    // Create new contextual conversation
    let name = 'Discussion';
    if (type === 'INCIDENT') {
      const incident = await this.prisma.incident.findUnique({ where: { id: contextId } });
      name = incident ? `Incident: ${incident.category} - ${incident.description.substring(0, 40)}` : 'Incident Discussion';
    } else if (type === 'DEPLOYMENT') {
      const deployment = await this.prisma.deployment.findUnique({
        where: { id: contextId },
        include: { site: true },
      });
      name = deployment ? `Deployment: ${deployment.site.name}` : 'Deployment Discussion';
    } else if (type === 'SITE') {
      const site = await this.prisma.site.findUnique({ where: { id: contextId } });
      name = site ? `Site: ${site.name}` : 'Site Discussion';
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        type,
        name,
        createdById: userId,
        [contextField]: contextId,
        participants: {
          create: [{ userId, role: 'ADMIN' }],
        },
      },
      include: { participants: true },
    });

    return conversation;
  }

  // ─── Get conversation details ─────────────────────────────────
  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    const isParticipant = conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) throw new ForbiddenException('You are not a member of this conversation');

    const participantUsers = await this.prisma.user.findMany({
      where: { id: { in: conversation.participants.map((p) => p.userId) } },
      select: { id: true, name: true, role: true, profileImg: true },
    });

    return { ...conversation, participantUsers };
  }
}
