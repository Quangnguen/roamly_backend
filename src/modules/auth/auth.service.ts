/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, username, password, name } = registerDto;

    // Check if email or username exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Email hoặc tên đăng nhập đã tồn tại');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create refresh token
    const refreshToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name,
        refreshToken,
        accountStatus: true,
        followers: [],
        following: [],
        role: 0, // or 1 depending on your definition
        private: false, // Set default private value
      },
    });

    // Generate JWT access token
    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    // Create new refresh token
    const refreshToken = crypto.randomBytes(32).toString('hex');

    // Update user with new refresh token
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // Generate JWT access token
    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    // Find user by refresh token
    const user = await this.prisma.user.findFirst({
      where: { refreshToken },
    });

    if (!user) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    // Generate new access token
    const payload = { sub: user.id, username: user.username };
    const accessToken = this.jwtService.sign(payload);

    // Generate new refresh token
    const newRefreshToken = crypto.randomBytes(32).toString('hex');

    // Update user with new refresh token
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
      },
    };
  }

  async logout(userId: string) {
    // Xóa refresh token khi logout
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }
}
