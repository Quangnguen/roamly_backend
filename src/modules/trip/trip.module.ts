import { Module } from '@nestjs/common';
import { TripController } from './trip.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { TripService } from './trip.service';

@Module({
  imports: [
    CloudinaryModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'Roamly',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [TripController],
  providers: [TripService, PrismaService, JwtStrategy],
})
export class TripModule {}
