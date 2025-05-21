// src/modules/user/user.module.ts
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../prisma/prisma.service'; // Đảm bảo PrismaService đã được cung cấp
import { JwtModule } from '@nestjs/jwt'; // Nếu cần sử dụng JWT trong UserModule (ví dụ để bảo vệ các route)
import { JwtStrategy } from '../auth/jwt.strategy'; // Nếu cần dùng lại JwtStrategy từ AuthModule
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
@Module({
  imports: [
    CloudinaryModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'Roamly', // Đảm bảo rằng secret này có thể được dùng chung giữa các module
      signOptions: { expiresIn: '1h' }, // Cấu hình thời gian hết hạn token
    }),
  ],
  controllers: [UserController], // Cấu hình controller cho UserModule
  providers: [UserService, PrismaService, JwtStrategy], // Cung cấp UserService, PrismaService và JwtStrategy (nếu cần)
})
export class UserModule {}
