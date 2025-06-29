// ===============================
// 📁 comment.service.ts
// ===============================
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocketGateway } from '../socket/socket.gateway';
import { NotificationService } from '../notification/notification.service';
import { response } from '../../common/utils/response.utils';

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly socketGateway: SocketGateway,
    private readonly notificationService: NotificationService,
  ) {}

  async createComment(
    postId: string,
    authorId: string,
    content: string,
    parentId?: string,
  ) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');

    const comment = await this.prisma.comment.create({
      data: {
        postId,
        authorId,
        content,
        parentId: parentId || undefined,
      },
      include: {
        author: {
          select: { id: true, username: true, profilePic: true },
        },
      },
    });

    await this.prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });

    if (post.authorId !== authorId) {
      await this.notificationService.createNotification({
        type: 'COMMENT',
        message: 'Ai đó đã bình luận bài viết của bạn',
        senderId: authorId,
        recipientId: post.authorId,
        postId,
      });
      const sender = await this.prisma.user.findUnique({
        where: { id: authorId },
        select: { id: true, username: true },
      });
      this.socketGateway.emitToUser(post.authorId, 'new_comment', {
        postId,
        comment,
      });

      this.socketGateway.emitToUser(post.authorId, 'new_notification', {
        type: 'COMMENT',
        postId,
        commentId: comment.id,
        username: sender?.username,
      });
    }

    return response('Bình luận thành công', 201, 'success', comment);
  }
  async updateComment(userId: string, commentId: string, content: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: {
          select: { id: true, username: true, profilePic: true },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('Không có quyền chỉnh sửa bình luận');
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          select: { id: true, username: true, profilePic: true },
        },
      },
    });
    this.socketGateway.emitToUser(comment.postId, 'comment_updated', {
      commentId,
      content,
    });

    return response('Cập nhật bình luận thành công', 200, 'success', updated);
  }

  async getComments(postId: string) {
    const comments = await this.prisma.comment.findMany({
      where: { postId, parentId: null },
      include: {
        author: { select: { id: true, username: true, profilePic: true } },
        replies: {
          include: {
            author: { select: { id: true, username: true, profilePic: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return response('Danh sách bình luận', 200, 'success', comments);
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Không tìm thấy bình luận');
    if (comment.authorId !== userId)
      throw new ForbiddenException('Không có quyền xoá');

    await this.prisma.comment.delete({ where: { id: commentId } });
    await this.prisma.post.update({
      where: { id: comment.postId },
      data: { commentCount: { decrement: 1 } },
    });

    this.socketGateway.emitToUser(comment.postId, 'comment_deleted', {
      commentId,
    });

    return response('Đã xoá bình luận', 200, 'success', null);
  }
}
