/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UploadedFiles,
  UseInterceptors,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { HomestayService } from './homestay.service';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../common/guard/roles.guard';
import { CreateHomestayDto } from './dto/create-homestay.dto';
import { UpdateHomestayDto } from './dto/update-homestay.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('🏠 Homestays')
@Controller('homestays')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HomestayController {
  constructor(private readonly homestayService: HomestayService) {}

  private groupFormData(body: any, dtoClass: any) {
    const baseDto =
      dtoClass === UpdateHomestayDto ? CreateHomestayDto : dtoClass;
    const dtoKeys = Object.keys(new baseDto());

    const arrayKeys = ['amenities', 'houseRules'];
    const numberKeys = [
      'latitude',
      'longitude',
      'pricePerNight',
      'maxGuests',
      'bedrooms',
      'beds',
      'bathrooms',
    ];
    const booleanKeys = ['isActive'];
    const nullableKeys = ['destinationId', 'phoneNumber', 'email', 'website'];
    const grouped: Record<string, unknown> = {};

    for (const key of Object.keys(body)) {
      if (dtoKeys.includes(key)) {
        let value = body[key];

        // Convert empty string to null for nullable fields
        if (value === '' && nullableKeys.includes(key)) {
          grouped[key] = null;
          continue;
        }

        // Skip empty strings for optional fields
        if (value === '' && key !== 'description') {
          continue;
        }

        // Convert to number
        if (numberKeys.includes(key) && typeof value === 'string') {
          value = parseFloat(value);
        }

        // Convert to boolean
        if (booleanKeys.includes(key) && typeof value === 'string') {
          value = value === 'true';
        }

        // Handle arrays
        if (arrayKeys.includes(key)) {
          if (typeof value === 'string') {
            try {
              value = JSON.parse(value);
            } catch (e) {
              value = value.split(',').map((item: string) => item.trim());
            }
          }
          if (!Array.isArray(value)) {
            value = [value];
          }
        }

        grouped[key] = value;
      }
    }

    return grouped;
  }

  @Post()
  @ApiOperation({ summary: 'Tạo homestay mới' })
  @ApiResponse({ status: 201, description: 'Homestay đã được tạo' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10))
  @Roles(Role.User, Role.Admin)
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() rawDto: any,
    @Req() req: any,
  ) {
    const dto = this.groupFormData(rawDto, CreateHomestayDto);
    const ownerId = req.user.id;
    return this.homestayService.createHomestay(
      ownerId,
      files,
      dto as unknown as CreateHomestayDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả homestays' })
  @ApiResponse({ status: 200, description: 'Danh sách homestays' })
  @ApiBearerAuth()
  @Roles(Role.User, Role.Admin)
  async findAll(@Req() req: any) {
    const userId = req.user?.id;
    return this.homestayService.getAllHomestays(userId);
  }

  @Get('my-homestays')
  @ApiOperation({
    summary: 'Lấy danh sách homestays của tôi (owner)',
    description:
      'Lấy tất cả homestays mà user sở hữu để quản lý. Bao gồm statistics về bookings, reviews, likes.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'all'],
    description: 'Filter theo trạng thái hoạt động. Default: all',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách homestays của owner với statistics',
  })
  @ApiBearerAuth()
  @Roles(Role.User, Role.Admin)
  async getMyHomestays(
    @Req() req: any,
    @Query('status') status?: 'active' | 'inactive' | 'all',
  ) {
    const ownerId = req.user.id;
    return this.homestayService.getMyHomestays(ownerId, status || 'all');
  }

  @Get('search')
  @ApiOperation({
    summary: 'Tìm kiếm homestays với nhiều filters',
    description:
      'Tìm kiếm theo từ khóa, city, price, rating, maxGuests, bedrooms, amenities. Có thể sortBy: price_asc, price_desc, rating, popular',
  })
  @ApiResponse({ status: 200, description: 'Kết quả tìm kiếm' })
  @ApiBearerAuth()
  @Roles(Role.User, Role.Admin)
  async search(
    @Query('q') query?: string,
    @Query('city') city?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('minRating') minRating?: string,
    @Query('maxGuests') maxGuests?: string,
    @Query('bedrooms') bedrooms?: string,
    @Query('amenities') amenities?: string, // comma-separated: WiFi,Kitchen,Pool
    @Query('sortBy') sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'popular',
    @Req() req?: any,
  ) {
    const userId = req?.user?.id;
    const amenitiesArray = amenities
      ? amenities.split(',').map((a) => a.trim())
      : undefined;

    return this.homestayService.searchHomestays(
      query,
      city,
      minPrice ? parseFloat(minPrice) : undefined,
      maxPrice ? parseFloat(maxPrice) : undefined,
      minRating ? parseFloat(minRating) : undefined,
      maxGuests ? parseInt(maxGuests) : undefined,
      bedrooms ? parseInt(bedrooms) : undefined,
      amenitiesArray,
      sortBy,
      userId,
    );
  }

  @Get('popular')
  @ApiOperation({
    summary: 'Lấy danh sách homestays phổ biến nhất',
    description: 'Sắp xếp theo viewCount, likeCount, reviewCount, rating',
  })
  @ApiResponse({ status: 200, description: 'Danh sách homestays phổ biến' })
  @ApiBearerAuth()
  @Roles(Role.User, Role.Admin)
  async getPopular(@Req() req: any, @Query('limit') limit?: string) {
    const userId = req.user?.id;
    const limitNum = limit ? parseInt(limit) : 10;
    return this.homestayService.getPopularHomestays(limitNum, userId);
  }

  @Get('popular/by-destination/:destinationId')
  @ApiOperation({
    summary: 'Lấy homestays phổ biến theo destination',
    description: 'Homestays nổi tiếng trong một địa điểm cụ thể',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách homestays phổ biến tại destination',
  })
  @ApiBearerAuth()
  @Roles(Role.User, Role.Admin)
  async getPopularByDestination(
    @Param('destinationId') destinationId: string,
    @Req() req: any,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user?.id;
    const limitNum = limit ? parseInt(limit) : 10;
    return this.homestayService.getPopularHomestaysByDestination(
      destinationId,
      limitNum,
      userId,
    );
  }

  @Get('by-destination/:destinationId')
  @ApiOperation({ summary: 'Lấy homestays theo destination' })
  @ApiResponse({ status: 200, description: 'Danh sách homestays' })
  @ApiBearerAuth()
  @Roles(Role.User, Role.Admin)
  async getByDestination(
    @Param('destinationId') destinationId: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.homestayService.getHomestaysByDestination(
      destinationId,
      userId,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết homestay (tự động tăng viewCount unique per user)',
  })
  @ApiResponse({ status: 200, description: 'Thông tin homestay' })
  @ApiBearerAuth()
  @Roles(Role.User, Role.Admin)
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id; // Required authentication
    return this.homestayService.getHomestayById(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật homestay' })
  @ApiResponse({ status: 200, description: 'Homestay đã được cập nhật' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10))
  @Roles(Role.User, Role.Admin)
  async update(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() rawDto: any,
    @Req() req: any,
  ) {
    const dto = this.groupFormData(rawDto, UpdateHomestayDto);
    const ownerId = req.user.id;
    return this.homestayService.updateHomestay(
      id,
      ownerId,
      files,
      dto as unknown as UpdateHomestayDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa homestay' })
  @ApiResponse({ status: 200, description: 'Homestay đã được xóa' })
  @ApiBearerAuth()
  @Roles(Role.User, Role.Admin)
  async remove(@Param('id') id: string, @Req() req: any) {
    const ownerId = req.user.id;
    return this.homestayService.deleteHomestay(id, ownerId);
  }
}
