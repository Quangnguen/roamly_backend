import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { BadRequestException } from '@nestjs/common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

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

    // Lấy số lượng followers và following
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

    return {
      ...user,
      followers: followersCount,
      following: followingCount,
    };
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });
  }

  async softDeleteUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        deleteAt: new Date(),
        accountStatus: false,
      },
    });
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

    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword, updatedAt: new Date() },
    });

    return { message: 'Đổi mật khẩu thành công' };
  }

  // Optional: cập nhật lastLogin sau khi login thành công
  async updateLastLogin(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
    });
  }
  async updateProfilePic(userId: string, file: Express.Multer.File) {
    // Kiểm tra user tồn tại
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    // Upload file lên Cloudinary
    const imageUrl = await this.cloudinary.uploadImage(file);

    // Cập nhật URL ảnh đại diện vào DB
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { profilePic: imageUrl.secure_url, updatedAt: new Date() },
      select: {
        id: true,
        profilePic: true,
      },
    });

    return updatedUser;
  }

  //   async followUser(currentUserId: string, targetUserId: string) {
  //     const currentUser = await this.prisma.user.findUnique({ where: { id: currentUserId } });
  //     const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });

  //     if (!targetUser) throw new NotFoundException('Người dùng không tồn tại');

  //     const updatedCurrentFollowing = [...(currentUser.following as any[]), { userId: targetUserId, followStatus: 'following' }];
  //     const updatedTargetFollowers = [...(targetUser.followers as any[]), { userId: currentUserId, followStatus: 'followed' }];

  //     await this.prisma.user.update({
  //       where: { id: currentUserId },
  //       data: { following: updatedCurrentFollowing },
  //     });

  //     return this.prisma.user.update({
  //       where: { id: targetUserId },
  //       data: { followers: updatedTargetFollowers },
  //     });
  //   }
}
