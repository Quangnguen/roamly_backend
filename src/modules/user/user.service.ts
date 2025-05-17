/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { BadRequestException } from '@nestjs/common';
import { response } from 'src/utils/response.util';
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        profilePic: true,
        followers: true,
        following: true,
        private: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
     return response('',200,'success', user)
  
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { ...dto },
      });
      return response('Cập nhật thông tin thành công', 200, 'success',updatedUser)
    } catch (error) {
      console.error('Error updating user:', error);
      return response('Cập nhật thông tin thất bại', 400, 'error')
    }
  }

  async softDeleteUser(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { deleteAt: new Date(), accountStatus: false },
    });

    return { message: 'Tài khoản của bạn sẽ bị xóa sau 30 ngày' };
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
      data: { password: hashedNewPassword },
    });

    return response("Đổi mật khẩu thành công", 200, "success");
  }

  async getUsers() {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          bio: true,
          profilePic: true,
          followers: true,
          following: true,
          private: true,
          role: true,
          createdAt: true,
        },
      });
      return response('', 200, 'success', users);
    } catch (error) {
      console.error('Error fetching users:', error);
      return response('Lấy danh sách người dùng thất bại', 400, 'error');
    }
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
