/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { response } from '../../common/utils/response.utils';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        gender: true,
        dob: true,
        phoneNumber: true,
        address: true,
        profilePic: true,
        private: true,
        verified: true,
        role: true,
        accountStatus: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const [followersCount, followingCount] = await Promise.all([
      this.prisma.follow.count({
        where: {
          followingId: userId,
          followStatus: 'accepted',
        },
      }),
      this.prisma.follow.count({
        where: {
          followerId: userId,
          followStatus: 'accepted',
        },
      }),
    ]);

    const postCount = await this.prisma.post.count({
      where: { authorId: userId, isPublic: true },
    });

    return response('', 200, 'success', {
      ...user,
      followersCount: followersCount,
      followingsCount: followingCount,
      postCount: postCount,
    });
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const [followersCount, followingsCount] = await Promise.all([
      this.prisma.follow.count({
        where: {
          followingId: userId,
          followStatus: 'accepted',
        },
      }),
      this.prisma.follow.count({
        where: {
          followerId: userId,
          followStatus: 'accepted',
        },
      }),
    ]);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });

    return response('Cập nhật người dùng thành công', 200, 'success', {
      ...updatedUser,
      followersCount: followersCount,
      followingsCount: followingsCount,
    });
  }

  async softDeleteUser(userId: string) {
    const deletedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        deleteAt: new Date(),
        accountStatus: false,
      },
    });

    return response(
      'Xoá mềm người dùng thành công',
      200,
      'success',
      deletedUser,
    );
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu cũ không đúng');
    }

    const hashedNewPassword: string = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword, updatedAt: new Date() },
    });

    return response('Đổi mật khẩu thành công', 200, 'success');
  }

  async updateLastLogin(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
    });

    return response('Cập nhật đăng nhập lần cuối thành công', 200, 'success');
  }
  async updateProfilePic(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const imageUrl = await this.cloudinary.uploadImage(file);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { profilePic: imageUrl.secure_url, updatedAt: new Date() },
      select: {
        id: true,
        profilePic: true,
      },
    });

    return response(
      'Cập nhật ảnh đại diện thành công',
      200,
      'success',
      updatedUser,
    );
  }

  async getUsers(currentUserId: string, pageInput?: any, limitInput?: any) {
    try {
      // Chuyển page và limit từ string (nếu có) sang số và gán giá trị mặc định
      const pageNum = parseInt(pageInput);
      const limitNum = parseInt(limitInput);

      const page = !isNaN(pageNum) && pageNum > 0 ? pageNum : 1;
      const limit = !isNaN(limitNum) && limitNum > 0 ? limitNum : 10;

      const skip = (page - 1) * limit;

      const [totalUsers, users] = await Promise.all([
        this.prisma.user.count({
          where: {
            NOT: { id: currentUserId },
          },
        }),
        this.prisma.user.findMany({
          where: {
            NOT: { id: currentUserId },
          },
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            bio: true,
            gender: true,
            dob: true,
            phoneNumber: true,
            address: true,
            profilePic: true,
            private: true,
            verified: true,
            role: true,
            accountStatus: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
      ]);

      const usersWithCounts = await Promise.all(
        users.map(async (user) => {
          const [followersCount, followingsCount] = await Promise.all([
            this.prisma.follow.count({
              where: {
                followingId: user.id,
                followStatus: 'accepted',
              },
            }),
            this.prisma.follow.count({
              where: {
                followerId: user.id,
                followStatus: 'accepted',
              },
            }),
          ]);

          return {
            ...user,
            followersCount,
            followingsCount,
          };
        }),
      );

      return response('', 200, 'success', {
        total: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit),
        users: usersWithCounts,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return response('Lấy danh sách người dùng thất bại', 400, 'error');
    }
  }
  private removeVietnameseTones(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }
  async searchUsers(q: string, userId: string, page = 1, limit = 10) {
    const rawKeyword = q.trim().toLowerCase();
    const keyword = this.removeVietnameseTones(rawKeyword).replace(/\s+/g, '');

    // Lấy danh sách user đủ điều kiện (loại bỏ user hiện tại)
    const rawUsers = await this.prisma.user.findMany({
      where: {
        accountStatus: true,
        private: false,
        NOT: {
          id: userId,
        },
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        profilePic: true,
      },
    });

    let filteredUsers = rawUsers;
    let isFallback = false;

    if (keyword.length > 0) {
      filteredUsers = rawUsers.filter((user) => {
        const username = this.removeVietnameseTones(user.username || '')
          .toLowerCase()
          .replace(/\s+/g, '');
        const name = this.removeVietnameseTones(user.name || '')
          .toLowerCase()
          .replace(/\s+/g, '');
        const email = this.removeVietnameseTones(user.email || '')
          .toLowerCase()
          .replace(/\s+/g, '');
        return (
          username.includes(keyword) ||
          name.includes(keyword) ||
          email.includes(keyword)
        );
      });

      if (filteredUsers.length === 0) {
        isFallback = true;
        filteredUsers = rawUsers;
      }
    } else {
      isFallback = true;
    }

    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const pagedUsers = filteredUsers.slice(skip, skip + limit);
    const userIds = pagedUsers.map((user) => user.id);

    const followersGroup = await this.prisma.follow.groupBy({
      by: ['followingId'],
      where: {
        followingId: { in: userIds },
      },
      _count: { followingId: true },
    });

    const followerCountMap = new Map(
      followersGroup.map((item) => [item.followingId, item._count.followingId]),
    );

    const followed = await this.prisma.follow.findMany({
      where: {
        followerId: userId,
        followingId: { in: userIds },
      },
      select: { followingId: true },
    });

    const followingIds = new Set(followed.map((f) => f.followingId));

    const results = pagedUsers
      .map((user) => ({
        id: user.id,
        username: user.username,
        name: user.name,
        profilePic: user.profilePic,
        followerCount: followerCountMap.get(user.id) || 0,
        isFollowing: followingIds.has(user.id),
      }))
      .sort((a, b) => (isFallback ? b.followerCount - a.followerCount : 0));

    if (results.length === 0 && !isFallback) {
      return {
        message: 'Không tìm thấy người dùng phù hợp',
        statusCode: 200,
        data: {
          currentPage: page,
          total: 0,
          totalPages: 0,
          results: [],
        },
      };
    }

    return {
      message: isFallback
        ? keyword.length === 0
          ? 'Hiển thị người dùng nổi bật'
          : 'Không tìm thấy người dùng phù hợp, hiển thị người dùng nổi bật'
        : 'Tìm kiếm người dùng thành công',
      statusCode: 200,
      data: {
        currentPage: page,
        total,
        totalPages,
        results,
      },
    };
  }
}
