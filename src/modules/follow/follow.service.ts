// follow.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFollowDto } from './dto/create-follow.dto';
import { UpdateFollowStatusDto } from './dto/update-follow-status.dto';

@Injectable()
export class FollowService {
  constructor(private prisma: PrismaService) {}

  async createFollow(followerId: string, dto: CreateFollowDto) {
    const { followingId } = dto;
    if (followerId === followingId) {
      throw new ForbiddenException('Cannot follow yourself');
    }

    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (existing) return existing;

    const targetUser = await this.prisma.user.findUnique({
      where: { id: followingId },
    });
    if (!targetUser) throw new NotFoundException('User not found');

    const followStatus = targetUser.private ? 'pending' : 'accepted';

    return this.prisma.follow.create({
      data: { followerId, followingId, followStatus },
    });
  }

  async updateFollowStatus(
    followingId: string,
    followerId: string,
    dto: UpdateFollowStatusDto,
  ) {
    const follow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (!follow) throw new NotFoundException('Follow not found');

    return this.prisma.follow.update({
      where: { followerId_followingId: { followerId, followingId } },
      data: { followStatus: dto.followStatus },
    });
  }

  async deleteFollow(followerId: string, followingId: string) {
    return this.prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId } },
    });
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
          },
        },
      },
    });

    return following.map((f) => f.following);
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
          },
        },
      },
    });

    return followers.map((f) => f.follower);
  }

  async checkFollowStatus(followerId: string, followingId: string) {
    return this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
  }
}
