import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './modules/prisma/prisma.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { PostModule } from './modules/post/post.module';
import { FollowModule } from './modules/follow/follow.module';
import { LikeModule } from './modules/like/like.module';
import { NotificationModule } from './modules/notification/notification.module';
import { TripModule } from './modules/trip/trip.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { SocketGateway } from './modules/socket/post.gateway';
@Module({
  imports: [
    UserModule,
    AuthModule,
    PostModule,
    FollowModule,
    TripModule,
    CloudinaryModule,
    LikeModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, SocketGateway],
})
export class AppModule {}
