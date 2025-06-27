// 📁 chat.service.ts
// ===============================
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocketGateway } from '../socket/socket.gateway';
import { NotificationService } from '../notification/notification.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { response } from '../../common/utils/response.utils';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly socketGateway: SocketGateway,
    private readonly notificationService: NotificationService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async createConversation(
    creatorId: string,
    userIds: string[],
    name?: string,
  ) {
    const isGroup = userIds.length > 2;

    if (!isGroup && userIds.length !== 2) {
      throw new BadRequestException('Chat cá nhân phải có đúng 2 người');
    }

    if (!isGroup) {
      const existing = await this.prisma.conversation.findFirst({
        where: {
          isGroup: false,
          participants: {
            every: { userId: { in: userIds } },
          },
        },
        include: { participants: true },
      });

      if (existing && existing.participants.length === 2) {
        return response('Đã có cuộc trò chuyện', 200, 'exists', existing);
      }
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        isGroup,
        name: isGroup ? name : null,
        createdById: creatorId,
        participants: {
          create: userIds.map((id) => ({ userId: id })),
        },
      },
      include: {
        participants: { include: { user: true } },
      },
    });

    for (const participant of conversation.participants) {
      if (participant.userId !== creatorId) {
        await this.notificationService.createNotification({
          type: 'MESSAGE',
          message: isGroup
            ? `Bạn được thêm vào nhóm "${name}"`
            : 'Đã bắt đầu cuộc trò chuyện với bạn',
          senderId: creatorId,
          recipientId: participant.userId,
          data: { conversationId: conversation.id },
        });
        const creater = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, username: true },
        });
        const conversation = await this.prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { id: true, name: true },
        });
        this.socketGateway.emitToUser(participant.userId, 'new_notification', {
          type: 'MESSAGE',
          conversationId: conversation.id,
          username: creater?.username,
          conversationName: conversation?.name,
        });
      }
    }

    return response(
      'Tạo cuộc trò chuyện thành công',
      201,
      'success',
      conversation,
    );
  }
  async editMessage(userId: string, messageId: string, content: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('Không tìm thấy tin nhắn');

    if (message.senderId !== userId) {
      throw new ForbiddenException('Bạn không thể chỉnh sửa tin nhắn này');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        updatedAt: new Date(),
      },
    });

    this.socketGateway.emitToUser(message.conversationId, 'message_edited', {
      messageId,
      content,
    });

    return response('Tin nhắn đã được chỉnh sửa', 200, 'success', updated);
  }
  async getConversationMembers(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, profilePic: true } },
          },
        },
      },
    });

    if (!conversation)
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện');

    return response(
      'Danh sách thành viên',
      200,
      'success',
      conversation.participants,
    );
  }

  async sendMessage(
    senderId: string,
    conversationId: string,
    content = '',
    files: Express.Multer.File[] = [],
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation)
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện');

    const isParticipant = conversation.participants.some(
      (p) => p.userId === senderId,
    );
    if (!isParticipant)
      throw new ForbiddenException('Không có quyền gửi tin nhắn');

    let mediaUrls: string[] = [];
    let mediaType: string | undefined = undefined;

    if (files.length > 0) {
      mediaUrls = await this.cloudinary.uploadMultiple(files);
      mediaType = files[0].mimetype.startsWith('video') ? 'video' : 'image';
    }

    const message = await this.prisma.message.create({
      data: {
        senderId,
        conversationId,
        content,
        mediaUrls,
        mediaType,
      },
      include: {
        sender: { select: { id: true, username: true, profilePic: true } },
      },
    });

    for (const participant of conversation.participants) {
      if (participant.userId !== senderId) {
        this.socketGateway.emitToUser(participant.userId, 'new_message', {
          conversationId,
          message,
        });

        await this.notificationService.createNotification({
          type: 'MESSAGE',
          message: 'Bạn có tin nhắn mới',
          senderId,
          recipientId: participant.userId,
          data: { conversationId, messageId: message.id },
        });
        const sender = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, username: true },
        });
        const conversation = await this.prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { id: true, name: true },
        });
        this.socketGateway.emitToUser(participant.userId, 'new_notification', {
          type: 'MESSAGE',
          conversationId,
          messageId: message.id,
          username: sender?.username,
          conversationName: conversation?.name,
        });
      }
    }

    return response('Gửi tin nhắn thành công', 201, 'success', message);
  }

  async getMessages(conversationId: string, limit = 20, before?: string) {
    const where: any = { conversationId };

    if (before) {
      const beforeMessage = await this.prisma.message.findUnique({
        where: { id: before },
        select: { createdAt: true },
      });
      if (!beforeMessage) throw new NotFoundException('Tin nhắn không tồn tại');
      where.createdAt = { lt: beforeMessage.createdAt };
    }

    const messages = await this.prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profilePic: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return response('Danh sách tin nhắn', 200, 'success', messages.reverse());
  }

  async deleteMessage(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('Không tìm thấy tin nhắn');

    const isSender = message.senderId === userId;
    const now = new Date();
    const diffInMinutes =
      (now.getTime() - message.createdAt.getTime()) / (1000 * 60);

    if (isSender && diffInMinutes <= 10) {
      if (message.mediaUrls?.length) {
        for (const url of message.mediaUrls) {
          const publicId = this.cloudinary.extractPublicId(url);
          if (publicId) await this.cloudinary.deleteImage(publicId);
        }
      }

      const updated = await this.prisma.message.update({
        where: { id: messageId },
        data: { content: '[Tin nhắn đã được thu hồi]', deletedForAll: true },
      });

      this.socketGateway.emitToUser(message.conversationId, 'message_deleted', {
        messageId,
      });

      return response('Đã thu hồi tin nhắn', 200, 'success', updated);
    }

    throw new ForbiddenException('Không thể xoá tin nhắn này');
  }

  async markAsSeen(userId: string, conversationId: string) {
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        NOT: { seenBy: { has: userId } },
      },
      data: {
        seenBy: { push: userId },
      },
    });

    this.socketGateway.emitToUser(conversationId, 'message_seen', { userId });

    return response('Đánh dấu đã xem', 200, 'success', null);
  }

  async getUserConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, profilePic: true } },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return response('Danh sách cuộc trò chuyện', 200, 'success', conversations);
  }

  async reactToMessage(userId: string, messageId: string, reaction: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Không tìm thấy tin nhắn');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, profilePic: true },
    });

    const userReaction = await this.prisma.messageReaction.upsert({
      where: {
        message_user_unique: { messageId, userId },
      },
      update: { reaction },
      create: {
        userId,
        messageId,
        reaction,
      },
    });

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: message.conversationId },
      include: { participants: true },
    });

    if (conversation) {
      for (const participant of conversation.participants) {
        if (participant.userId !== userId) {
          this.socketGateway.emitToUser(participant.userId, 'message_reacted', {
            messageId,
            user: user,
            reaction,
          });
        }
      }
    }

    return response('Đã thả cảm xúc tin nhắn', 200, 'success', userReaction);
  }

  async getReactions(messageId: string) {
    const reactions = await this.prisma.messageReaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: { id: true, username: true, profilePic: true },
        },
      },
    });

    return response('Danh sách cảm xúc', 200, 'success', reactions);
  }
  async pinMessage(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { participants: true } } },
    });

    if (!message) throw new NotFoundException('Không tìm thấy tin nhắn');

    const isParticipant = message.conversation.participants.some(
      (p) => p.userId === userId,
    );
    if (!isParticipant)
      throw new ForbiddenException('Không có quyền ghim tin nhắn này');

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { pinned: true },
    });

    for (const participant of message.conversation.participants) {
      if (participant.userId !== userId) {
        this.socketGateway.emitToUser(participant.userId, 'message_pinned', {
          conversationId: message.conversationId,
          messageId,
        });
      }
    }

    return response('Đã ghim tin nhắn', 200, 'success', updated);
  }

  async unpinMessage(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { participants: true } } },
    });

    if (!message) throw new NotFoundException('Không tìm thấy tin nhắn');

    const isParticipant = message.conversation.participants.some(
      (p) => p.userId === userId,
    );
    if (!isParticipant)
      throw new ForbiddenException('Không có quyền bỏ ghim tin nhắn này');

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { pinned: false },
    });

    for (const participant of message.conversation.participants) {
      if (participant.userId !== userId) {
        this.socketGateway.emitToUser(participant.userId, 'message_unpinned', {
          conversationId: message.conversationId,
          messageId,
        });
      }
    }

    return response('Đã bỏ ghim tin nhắn', 200, 'success', updated);
  }

  async getPinnedMessages(conversationId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        pinned: true,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profilePic: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return response('Danh sách tin nhắn đã ghim', 200, 'success', messages);
  }
  async sendTypingStatus(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    }

    const isParticipant = conversation.participants.some(
      (p) => p.userId === userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException('Bạn không thuộc cuộc trò chuyện này');
    }

    for (const participant of conversation.participants) {
      if (participant.userId !== userId) {
        this.socketGateway.emitToUser(participant.userId, 'typing', {
          conversationId,
          userId,
        });
      }
    }

    return response('Đã gửi trạng thái đang nhập', 200, 'success', null);
  }
}
