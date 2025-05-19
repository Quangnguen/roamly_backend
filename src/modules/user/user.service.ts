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

    return response('Lấy thông tin người dùng thành công', 200, 'success', {
      ...user,
      followers: followersCount,
      following: followingCount,
    });
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });

    return response(
      'Cập nhật người dùng thành công',
      200,
      'success',
      updatedUser,
    );
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

    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);

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
}
