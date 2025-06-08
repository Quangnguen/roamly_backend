import { Module } from '@nestjs/common';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../auth/jwt.strategy';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    CloudinaryModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'Roamly',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [FollowController],
  providers: [FollowService, PrismaService, JwtStrategy],
  exports: [FollowService],
})
export class FollowModule {}
