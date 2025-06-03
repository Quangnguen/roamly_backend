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

        console.log('Updating trip with ID:', dto);
        
        // Tạo object update data với giá trị mặc định
        const updateData: any = {};
        
        // Xử lý từng trường riêng biệt
        // String fields: chuỗi rỗng nếu undefined
        updateData.title = dto.title !== undefined ? dto.title : '';
        updateData.description = dto.description !== undefined ? dto.description : '';
        updateData.homestay = dto.homestay !== undefined ? dto.homestay : '';
        updateData.privacy = dto.privacy !== undefined ? dto.privacy : trip.privacy;
        
        // Date fields: giữ nguyên nếu undefined
        if (dto.startDate !== undefined) updateData.startDate = dto.startDate;
        if (dto.endDate !== undefined) updateData.endDate = dto.endDate;
        
        // Array fields: mảng rỗng nếu undefined
        updateData.placesVisited = dto.placesVisited !== undefined ? dto.placesVisited : [];
        updateData.tags = dto.tags !== undefined ? dto.tags : [];
        updateData.participants = dto.participants !== undefined ? dto.participants : [];
        
        // Object fields: object rỗng nếu undefined
        updateData.cost = dto.cost !== undefined ? dto.cost : {};
        
        // Chỉ upload và cập nhật imageUrl nếu có files mới
        if (files && files.length > 0) {
            const imageUrls = await this.cloudinary.uploadMultiple(files);
            updateData.imageUrl = imageUrls;
        } else if (dto.imageUrl !== undefined) {
            // Nếu không có files mới nhưng có imageUrl trong DTO
            updateData.imageUrl = dto.imageUrl;
        }
        
        // Log để debug
        console.log('Update data:', updateData);
        
        const updated = await this.prisma.trip.update({
            where: { id: tripId },
            data: updateData,
        });
        
        return response(
            'Trip updated successfully',
            200,
            'success',
            updated
        );
    }
}
