import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { response } from 'src/utils/response.util';
import { CreateTripDto } from './dto/create-trip.dto';

@Injectable()
export class TripService {

    constructor(
        private prisma: PrismaService,
        private cloudinary: CloudinaryService,
      ) {}

    
    async createTrip(authorId: string, files: Express.Multer.File[], dto: CreateTripDto) {
        try {
            // Upload images to Cloudinary
            const imageUrls = await this.cloudinary.uploadMultiple(files);

            // Create trip in the database
            const create = await this.prisma.trip.create({
                data: {
                    ...dto,
                    userId: authorId,
                    imageUrl: imageUrls,
                },
            });

            return response(
                'Trip created successfully',
                201,
                'success',
                create
            );
        } catch (error) {
            return response(
                error.message || 'Tạo trip thất bại',
                400,
                'error',
                null
            );
        }
    }
}
