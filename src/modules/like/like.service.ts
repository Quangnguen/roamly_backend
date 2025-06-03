// like.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { response } from '../../common/utils/response.utils';
import { NotificationType } from '../../../generated/prisma';
@Injectable()
export class LikeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async like(userId: string, targetId: string, type: string) {
    if (!userId || !targetId || !type) {
      throw new ForbiddenException('Thiếu thông tin cần thiết');
    }

    const existing = await this.prisma.like.findUnique({
      where: { userId_targetId_type: { userId, targetId, type } },
    });

    if (existing) {
      return response('Đã thích trước đó', 200, 'success', existing);
    }

    const like = await this.prisma.like.create({
      data: { userId, targetId, type },
    });

    // Tạo notification khi like bài viết (post)
    if (type === 'post') {
      const post = await this.prisma.post.findUnique({
        where: { id: targetId },
      });
      console.log('post.authorId:', post?.authorId);
      console.log(userId);
      console.log(NotificationType.LIKE);
      if (post && post.authorId !== userId) {
        try {
          console.log(NotificationType.LIKE);
          await this.notificationService.createNotification({
            type: NotificationType.LIKE,
            message: 'ai đó đã thích bài viết của bạn',
            senderId: userId,
            recipientId: post.authorId,
            postId: post.id,
          });
        } catch (error) {
          console.error('Error creating notification:', error);
        }
      }
    }

    return response('Đã yêu thích', 201, 'success', like);
  }

  async unlike(userId: string, targetId: string, type: string) {
    const like = await this.prisma.like.findUnique({
      where: { userId_targetId_type: { userId, targetId, type } },
    });

    if (!like) {
      throw new NotFoundException('Không tìm thấy lượt thích');
    }

    await this.prisma.like.delete({
      where: { userId_targetId_type: { userId, targetId, type } },
    });

    return response('Đã bỏ thích', 200, 'success', null);
  }
}
