import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFollowDto } from './dto/create-follow.dto';
import { UpdateFollowStatusDto } from './dto/update-follow-status.dto';
import { response } from '../../common/utils/response.utils';

@Injectable()
export class FollowService {
  constructor(private prisma: PrismaService) {}

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
}
