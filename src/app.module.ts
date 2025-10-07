import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './modules/prisma/prisma.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { PostModule } from './modules/post/post.module';
import { FollowModule } from './modules/follow/follow.module';
import { LikeModule } from './modules/like/like.module';
import { CommentModule } from './modules/comment/comment.module';
import { ChatModule } from './modules/chat/chat.module';
import { NotificationModule } from './modules/notification/notification.module';
import { TripModule } from './modules/trip/trip.module';
import { DestinationModule } from './modules/destination/destination.module';
import { HomestayModule } from './modules/homestay/homestay.module';
import { BookingModule } from './modules/booking/booking.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { SocketGateway } from './modules/socket/socket.gateway';

@Module({
  imports: [
    UserModule,
    AuthModule,
    PostModule,
    FollowModule,
    TripModule,
    DestinationModule,
    HomestayModule,
    BookingModule,
    CloudinaryModule,
    LikeModule,
    NotificationModule,
    CommentModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, SocketGateway],
})
export class AppModule {}
