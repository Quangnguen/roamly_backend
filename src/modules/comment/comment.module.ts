import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../auth/jwt.strategy';
import { NotificationModule } from '../notification/notification.module';
import { SocketGateway } from '../socket/socket.gateway';
@Module({
  imports: [
    NotificationModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'Roamly',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [CommentController],
  providers: [CommentService, PrismaService, JwtStrategy, SocketGateway],
})
export class CommentModule {}
