/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { response } from 'src/utils/response.util';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

@Injectable()
export class TripService {

    constructor(
        private prisma: PrismaService,
        private cloudinary: CloudinaryService,
      ) {}

    
    async createTrip(authorId: string, files: Express.Multer.File[], dto: CreateTripDto) {
        try {
            const imageUrls = await this.cloudinary.uploadMultiple(files);

            // Create trip in the database
            const create = await this.prisma.trip.create({
                data: {
                    ...dto,
                    userId: authorId,
                    imageUrl: imageUrls,
                    privacy: dto.privacy as string, // Cast to the correct enum type if necessary
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
                (error instanceof Error ? error.message : 'Tạo trip thất bại'),
                error.statusCode || 500,
                'error',
                null
            );
        }
    }

    async getTripsByUserId(userId: string) {
        const trips = await this.prisma.trip.findMany({
            where: { userId: userId },
            orderBy: { createdAt: 'desc' },
        });
        return response(
            'Trips retrieved successfully',
            200,
            'success',
            trips
        );
    }

    async deleteTrip(tripId: string, userId: string) {
        const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
        if (!trip) {
            throw new NotFoundException('Trip not found');
        }
        if (trip.userId !== userId) {
            throw new ForbiddenException('You are not allowed to delete this trip');
        }
        await this.prisma.trip.delete({ where: { id: tripId } });
        return response(
            'Trip deleted successfully',
            200,
            'success',
            null
        );
    }

    async updateTrip(
        tripId: string,
        userId: string,
        files: Express.Multer.File[],
        dto: UpdateTripDto
    ) {
        const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
        if (!trip) {
            throw new NotFoundException('Trip not found');
        }
        if (trip.userId !== userId) {
            throw new ForbiddenException('You are not allowed to update this trip');
        }
        // Xử lý files nếu cần (ví dụ: upload ảnh mới)
        const imageUrls = await this.cloudinary.uploadMultiple(files);

        const updated = await this.prisma.trip.update({
            where: { id: tripId },
            data: {
                ...dto,
                imageUrl: imageUrls,

            },           
        });
        return response(
            'Trip updated successfully',
            200,
            'success',
            updated
        );
    }
}
