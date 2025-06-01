/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
    Controller,
    Post,
    Body,
    UploadedFiles,
    UseInterceptors,
    Req,
    UseGuards,
    UsePipes,
    Param,
    Get,
    Delete,
    Patch,
} from '@nestjs/common';
import { TripService } from './trip.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { CustomValidationPipe } from 'src/common/pipe/validation.pipe';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { CreateTripDto } from './dto/create-trip.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { UpdateTripDto } from './dto/update-trip.dto'; // Tạo file này nếu chưa có

@Controller('memory')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new CustomValidationPipe())
export class TripController {
    constructor(private readonly tripService: TripService) { }

    private groupFormData(body: any, dtoClass: any) {
        const dtoKeys = Object.keys(new dtoClass());
        const arrayKeys = ['placesVisited', 'tags', 'participants', 'sharedWith'];
        const grouped: Record<string, unknown> = {};
        for (const key of Object.keys(body)) {
            if (dtoKeys.includes(key)) {
                let value = body[key];
                // Nếu key là 'cost' và value là string, thử parse JSON
                if (key === 'cost' && typeof value === 'string') {
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        // Nếu parse lỗi thì giữ nguyên
                    }
                }
                if (grouped[key]) {
                    if (Array.isArray(grouped[key])) {
                        grouped[key].push(value);
                    } else {
                        grouped[key] = [grouped[key], value];
                    }
                } else {
                    grouped[key] = value;
                }
            }
        }
        // Chỉ các key trong arrayKeys mới luôn là mảng
        for (const key of arrayKeys) {
            if (grouped[key] !== undefined && !Array.isArray(grouped[key])) {
                grouped[key] = [grouped[key]];
            }
        }
        return grouped;
    }

    @Post('create')
    @UseInterceptors(FilesInterceptor('images'))
    @Roles(Role.User, Role.Admin)
    createTrip(
        @UploadedFiles() files: Express.Multer.File[],
        @Body() dto: any,
        @Req() req: any,
    ) {
        console.log('Memory');
        const authorId = req.user.id;
        // Gom các trường trùng tên thành mảng
        const groupedData = this.groupFormData(dto, CreateTripDto);
        const createTripDto = Object.assign(new CreateTripDto(), groupedData);
        return this.tripService.createTrip(authorId, files, createTripDto);
    }

    @Get('user/:userId')
    @Roles(Role.User, Role.Admin)
    getTripsByUserId(@Param('userId') userId: string) {
        return this.tripService.getTripsByUserId(userId);
    }

    @Get('my-trips')
    @Roles(Role.User, Role.Admin)
    getMyTrips(@Req() req: any) {
        const userId = req.user.id;
        return this.tripService.getTripsByUserId(userId);
    }

    @Delete('delete/:id')
    @Roles(Role.User, Role.Admin)
    deleteTrip(@Param('id') id: string, @Req() req: any) {
        const userId = req.user.id;
        return this.tripService.deleteTrip(id, userId);
    }

    @Patch('update/:id')
    @UseInterceptors(FilesInterceptor('images'))
    @Roles(Role.User, Role.Admin)
    async updateTrip(
        @Param('id') id: string,
        @UploadedFiles() files: Express.Multer.File[],
        @Body() dto: any,
        @Req() req: any,
    ) {
        const userId = req.user.id;
        const groupedData = this.groupFormData(dto, UpdateTripDto);
        const updateTripDto = Object.assign(new UpdateTripDto(), groupedData);
        return this.tripService.updateTrip(id, userId, files, updateTripDto);
    }
}
