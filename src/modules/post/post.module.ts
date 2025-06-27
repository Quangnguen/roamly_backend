import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../auth/jwt.strategy';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { FollowModule } from '../follow/follow.module';
import { SocketGateway } from '../socket/socket.gateway';

@Module({
  imports: [
    CloudinaryModule,
    FollowModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'Roamly',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [PostController],
  providers: [PostService, PrismaService, JwtStrategy, SocketGateway],
})
export class PostModule {}
