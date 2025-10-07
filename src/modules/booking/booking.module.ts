import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { PrismaService } from '../prisma/prisma.service';
import { SocketModule } from '../socket/socket.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [SocketModule, NotificationModule],
  controllers: [BookingController],
  providers: [BookingService, PrismaService],
  exports: [BookingService],
})
export class BookingModule {}
