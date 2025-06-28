import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../auth/jwt.strategy';
import { NotificationModule } from '../notification/notification.module';
import { SocketGateway } from '../socket/socket.gateway';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
@Module({
  imports: [
    NotificationModule,
    CloudinaryModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'Roamly',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, PrismaService, JwtStrategy, SocketGateway],
})
export class ChatModule {}
