/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
    console.log('Image URL:', imageUrl);

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
}
