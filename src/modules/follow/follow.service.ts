import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFollowDto } from './dto/create-follow.dto';
import { UpdateFollowStatusDto } from './dto/update-follow-status.dto';
import { response } from '../../common/utils/response.utils';
import { SocketGateway } from '../socket/socket.gateway';
import { NotificationType } from '../../../generated/prisma';
import { NotificationService } from '../notification/notification.service';
@Injectable()
export class FollowService {
  constructor(
    private prisma: PrismaService,
    private readonly socketGateway: SocketGateway,
    private readonly notificationService: NotificationService,
  ) {}

  async createFollow(followerId: string, dto: CreateFollowDto) {
    const { followingId } = dto;

    if (followerId === followingId) {
      throw new ForbiddenException('Không thể theo dõi chính mình');
    }

    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (existing) {
      return response('Đã theo dõi trước đó', 200, 'success', existing);
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const followStatus = targetUser.private ? 'pending' : 'accepted';

    const follow = await this.prisma.follow.create({
      data: { followerId, followingId, followStatus },
    });

    const sender = await this.prisma.user.findUnique({
      where: { id: followerId },
      select: { username: true },
    });

    if (followStatus === 'accepted') {
      await this.notificationService.createNotification({
        type: NotificationType.FOLLOW,
        message: 'Ai đó đã theo dõi bạn',
        senderId: followerId,
        recipientId: followingId,
      });

      this.socketGateway.emitToUser(followingId, 'new_follower', {
        followerId,
        username: sender?.username,
      });

      this.socketGateway.emitToUser(followingId, 'new_notification', {
        type: NotificationType.FOLLOW,
        username: sender?.username,
        status: 'accept',
      });
    } else {
      await this.notificationService.createNotification({
        type: NotificationType.FOLLOW,
        message: 'Ai đó đã yêu cầu theo dõi bạn',
        senderId: followerId,
        recipientId: followingId,
      });

      this.socketGateway.emitToUser(followingId, 'follow_request', {
        followerId,
        username: sender?.username,
      });

      this.socketGateway.emitToUser(followingId, 'new_notification', {
        type: NotificationType.FOLLOW,
        username: sender?.username,
        status: 'pending',
      });
    }

    return response('Theo dõi thành công', 201, 'success', follow);
  }

  async updateFollowStatus(
    followingId: string,
    followerId: string,
    dto: UpdateFollowStatusDto,
  ) {
    const follow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (!follow) {
      throw new NotFoundException('Không tìm thấy lượt theo dõi');
    }

    const updated = await this.prisma.follow.update({
      where: { followerId_followingId: { followerId, followingId } },
      data: { followStatus: dto.followStatus },
    });

    if (follow.followStatus === 'pending' && dto.followStatus === 'accepted') {
      await this.notificationService.createNotification({
        type: NotificationType.FOLLOW,
        message: 'Yêu cầu theo dõi của bạn đã được chấp nhận',
        senderId: followingId,
        recipientId: followerId,
      });

      const sender = await this.prisma.user.findUnique({
        where: { id: followingId },
        select: { username: true },
      });

      this.socketGateway.emitToUser(followerId, 'follow_request_accepted', {
        userId: followingId,
        username: sender?.username,
      });

      this.socketGateway.emitToUser(followerId, 'new_notification', {
        type: NotificationType.FOLLOW,
        username: sender?.username,
        status: 'accept',
      });
    }

    return response(
      'Cập nhật trạng thái theo dõi thành công',
      200,
      'success',
      updated,
    );
  }

  async deleteFollow(followerId: string, followingId: string) {
    const deleted = await this.prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId } },
    });

    return response('Huỷ theo dõi thành công', 200, 'success', deleted);
  }

  async getFollowing(userId: string) {
    const following = await this.prisma.follow.findMany({
      where: {
        followerId: userId,
        followStatus: 'accepted',
      },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            profilePic: true,
            createdAt: true,
          },
        },
      },
    });

    const data = following.map((f) => f.following);
    return response('Danh sách đang theo dõi', 200, 'success', data);
  }

  async getFollowers(userId: string) {
    const followers = await this.prisma.follow.findMany({
      where: {
        followingId: userId,
        followStatus: 'accepted',
      },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            profilePic: true,
            createdAt: true,
          },
        },
      },
    });

    const data = followers.map((f) => f.follower);
    return response('Danh sách người theo dõi', 200, 'success', data);
  }

  async checkFollowStatus(followerId: string, followingId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    const message = follow
      ? 'Đã theo dõi hoặc đang chờ phê duyệt'
      : 'Chưa theo dõi';

    return response(message, 200, 'success', follow);
  }
  async getFollowingRawIds(userId: string): Promise<string[]> {
    const following = await this.prisma.follow.findMany({
      where: {
        followerId: userId,
        followStatus: 'accepted',
      },
      select: {
        followingId: true,
      },
    });

    return following.map((f) => f.followingId);
  }
}
