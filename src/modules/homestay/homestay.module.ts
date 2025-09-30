import { Module } from '@nestjs/common';
import { HomestayController } from './homestay.controller';
import { HomestayService } from './homestay.service';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [HomestayController],
  providers: [HomestayService, PrismaService],
  exports: [HomestayService],
})
export class HomestayModule {}
