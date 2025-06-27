import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { SocketGateway } from '../socket/socket.gateway';
import { response } from '../../common/utils/response.utils';
import { NotificationType } from '../../../generated/prisma';

@Injectable()
export class LikeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly socketGateway: SocketGateway,
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

    if (type === 'post') {
      const post = await this.prisma.post.findUnique({
        where: { id: targetId },
      });

      if (post && post.authorId !== userId) {
        await this.prisma.post.update({
          where: { id: targetId },
          data: { likeCount: { increment: 1 } },
        });
        // 🔔 Gửi thông báo và realtime tới chủ post
        await this.notificationService.createNotification({
          type: NotificationType.LIKE,
          message: 'Ai đó đã thích bài viết của bạn',
          senderId: userId,
          recipientId: post.authorId,
          postId: post.id,
        });

        this.socketGateway.emitToUser(post.authorId, 'post_liked', {
          postId: post.id,
          userId,
        });

        this.socketGateway.emitToUser(post.authorId, 'new_notification', {
          type: NotificationType.LIKE,
          postId: post.id,
        });
      }
    } else if (type === 'comment') {
      const comment = await this.prisma.comment.findUnique({
        where: { id: targetId },
      });

      if (!comment) {
        throw new NotFoundException('Không tìm thấy bình luận');
      }

      // Tăng likeCount
      await this.prisma.comment.update({
        where: { id: targetId },
        data: { likeCount: { increment: 1 } },
      });

      // Nếu người like khác tác giả comment, gửi thông báo
      if (comment.authorId !== userId) {
        await this.notificationService.createNotification({
          type: NotificationType.LIKE,
          message: 'Ai đó đã thích bình luận của bạn',
          senderId: userId,
          recipientId: comment.authorId,
          data: { commentId: comment.id }, // Gửi thêm dữ liệu tùy chỉnh nếu muốn
        });

        this.socketGateway.emitToUser(comment.authorId, 'comment_liked', {
          commentId: comment.id,
          userId,
        });

        this.socketGateway.emitToUser(comment.authorId, 'new_notification', {
          type: NotificationType.LIKE,
          commentId: comment.id,
        });
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

    if (type === 'post') {
      const post = await this.prisma.post.findUnique({
        where: { id: targetId },
      });

      if (post) {
        // 🔄 Cập nhật realtime khi unlike
        await this.prisma.post.update({
          where: { id: targetId },
          data: { likeCount: { decrement: 1 } },
        });
        this.socketGateway.emitToUser(post.authorId, 'post_unliked', {
          postId: targetId,
          userId,
        });

        this.socketGateway.emitToUser(userId, 'post_unliked', {
          postId: targetId,
          userId,
        });
      }
    } else if (type === 'comment') {
      const comment = await this.prisma.comment.findUnique({
        where: { id: targetId },
      });

      if (!comment) {
        throw new NotFoundException('Không tìm thấy bình luận');
      }

      // Giảm likeCount
      await this.prisma.comment.update({
        where: { id: targetId },
        data: { likeCount: { decrement: 1 } },
      });

      // Gửi realtime nếu cần
      this.socketGateway.emitToUser(comment.authorId, 'comment_unliked', {
        commentId: targetId,
        userId,
      });

      this.socketGateway.emitToUser(userId, 'comment_unliked', {
        commentId: targetId,
        userId,
      });
    }

    return response('Đã bỏ thích', 200, 'success', null);
  }
}
