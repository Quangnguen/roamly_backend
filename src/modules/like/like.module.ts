import { Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../auth/jwt.strategy';
import { NotificationModule } from '../notification/notification.module';
import { SocketGateway } from '../socket/post.gateway';
@Module({
  imports: [
    NotificationModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'Roamly',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [LikeController],
  providers: [LikeService, PrismaService, JwtStrategy, SocketGateway],
})
export class LikeModule {}
