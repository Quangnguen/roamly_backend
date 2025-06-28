// notification.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { response } from '../../common/utils/response.utils';
import { NotificationType } from '../../../generated/prisma';
@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async createNotification(data: {
    type: NotificationType;
    message: string;
    senderId?: string;
    recipientId: string;
    postId?: string;
    sharedPostId?: string;
    data?: any;
  }) {
    try {
      console.log('Notification Data:', data);
      const notification = await this.prisma.notification.create({
        data,
      });
      return response('Tạo thông báo thành công', 201, 'success', notification);
    } catch (error) {
      console.error('Lỗi khi tạo notification:', error);
      // Có thể throw lỗi tiếp hoặc trả về response lỗi
      throw new Error('Tạo notification thất bại');
    }
  }
  async getNotifications(userId: string, limit: number, offset: number) {
    // Đánh dấu tất cả thông báo chưa đọc là đã đọc
    await this.prisma.notification.updateMany({
      where: {
        recipientId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // Truy vấn danh sách thông báo (đã được đánh dấu là đã đọc)
    const notifications = await this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        sender: { select: { id: true, username: true, profilePic: true } },
        post: { select: { id: true, imageUrl: true } },
      },
    });

    return response('Danh sách thông báo', 200, 'success', notifications);
  }

  async markAsRead(notificationId: string, userId: string) {
    const noti = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!noti || noti.recipientId !== userId) {
      throw new ForbiddenException('Không có quyền truy cập');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return response('Đã đánh dấu thông báo là đã đọc', 200, 'success', updated);
  }

  async countUnread(userId: string) {
    const count = await this.prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });
    return response('Số lượng thông báo chưa đọc', 200, 'success', { count });
  }
}
