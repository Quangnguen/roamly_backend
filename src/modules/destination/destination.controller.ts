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
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { DestinationService } from './destination.service';
import { MLDataExportService } from './ml-data-export.service';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { SearchDestinationDto } from './dto/search-destination.dto';
import { CreateDestinationReviewDto } from './dto/create-review.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { DestinationValidationPipe } from './pipes/destination-validation.pipe';

@ApiTags('🗺️ Destinations')
@Controller('destinations')
@UsePipes(new DestinationValidationPipe())
export class DestinationController {
  constructor(
    private readonly destinationService: DestinationService,
    private readonly mlDataExportService: MLDataExportService,
  ) {}

  private groupFormData(body: any, dtoClass: any) {
    const dtoKeys = Object.keys(new dtoClass());
    const arrayKeys = [
      'category',
      'tags',
      'facilities',
      'activities',
      'travelTips',
    ];
    const numberKeys = ['latitude', 'longitude'];
    const booleanKeys = ['isPublic'];
    const grouped: Record<string, unknown> = {};

    for (const key of Object.keys(body)) {
      if (dtoKeys.includes(key)) {
        let value = body[key];

        // Skip empty strings for optional fields
        if (value === '' && key !== 'description') {
          continue;
        }

        // Parse JSON fields
        if (key === 'entryFee' && typeof value === 'string') {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // Keep original if parse fails
          }
        }

        // Convert to number
        if (numberKeys.includes(key) && typeof value === 'string') {
          value = parseFloat(value);
        }

        // Convert to boolean
        if (booleanKeys.includes(key) && typeof value === 'string') {
          value = value === 'true';
        }

        // Handle array fields - split by comma
        if (arrayKeys.includes(key) && typeof value === 'string') {
          value = value.split(',').map((v) => v.trim());
        }

        if (grouped[key]) {
          if (Array.isArray(grouped[key])) {
            if (Array.isArray(value)) {
              grouped[key] = [...(grouped[key] as any[]), ...value];
            } else {
              (grouped[key] as any[]).push(value);
            }
          } else {
            grouped[key] = [grouped[key], value];
          }
        } else {
          grouped[key] = value;
        }
      }
    }

    // Ensure array fields are arrays
    for (const key of arrayKeys) {
      if (grouped[key] !== undefined && !Array.isArray(grouped[key])) {
        grouped[key] = [grouped[key]];
      }
    }

    return grouped;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FilesInterceptor('images'))
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo địa điểm mới (Chỉ Admin)',
    description: `
    Tạo địa điểm du lịch mới với đầy đủ thông tin và hình ảnh.
    
    **⚠️ Yêu cầu:**
    - Chỉ user có **role = 1 (Admin)** mới được tạo destination
    - User thường (role = 0) sẽ nhận lỗi 403 Forbidden
    
    **Ví dụ:**
    - Tạo địa điểm cha: Ninh Bình (parentId = null)
    - Tạo địa điểm con: Tràng An (parentId = id của Ninh Bình)
    
    **Lưu ý:**
    - entryFee phải là JSON: {"adult": 120000, "child": 60000, "currency": "VND"}
    - category, tags, facilities, activities, travelTips là mảng string
    `,
  })
  @ApiBody({ type: CreateDestinationDto })
  @ApiResponse({
    status: 201,
    description: 'Địa điểm được tạo thành công',
    schema: {
      example: {
        message: 'Destination created successfully',
        statusCode: 201,
        status: 'success',
        data: {
          id: 'uuid',
          title: 'Hoi An Ancient Town',
          location: 'Hoi An, Quang Nam',
          city: 'Hoi An',
          country: 'Vietnam',
          imageUrl: ['https://cloudinary.com/image1.jpg'],
          rating: 0,
          likeCount: 0,
          reviewCount: 0,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Chưa đăng nhập' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Chỉ Admin (role = 1) mới được tạo destination',
  })
  @Roles(Role.Admin)
  createDestination(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: any,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const groupedData = this.groupFormData(dto, CreateDestinationDto);
    const createDto = Object.assign(new CreateDestinationDto(), groupedData);
    return this.destinationService.createDestination(userId, files, createDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.User, Role.Admin)
  @ApiOperation({
    summary: 'Lấy danh sách địa điểm',
    description:
      'Tìm kiếm và lọc địa điểm theo keyword, city, country, category, tags. Trả về isLiked=true nếu user đã like destination đó.',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách địa điểm',
    schema: {
      example: {
        message: 'Destinations retrieved successfully',
        statusCode: 200,
        status: 'success',
        data: {
          destinations: [],
          pagination: {
            total: 100,
            page: 1,
            limit: 20,
            totalPages: 5,
          },
        },
      },
    },
  })
  getDestinations(@Query() searchDto: SearchDestinationDto, @Req() req: any) {
    const userId = req.user.id;
    return this.destinationService.getDestinations(searchDto, userId);
  }

  @Get('popular')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.User, Role.Admin)
  @ApiOperation({
    summary: 'Lấy địa điểm phổ biến',
    description: 'Lấy danh sách địa điểm phổ biến nhất dựa trên like và review',
  })
  @ApiResponse({ status: 200, description: 'Địa điểm phổ biến' })
  getPopular(@Req() req: any, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const userId = req.user.id;
    return this.destinationService.getPopularDestinations(limitNum, userId);
  }

  @Get('my-destinations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy địa điểm đã thích',
    description: 'Lấy danh sách các địa điểm mà user hiện tại đã like',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách địa điểm đã like bởi user hiện tại',
  })
  @Roles(Role.User, Role.Admin)
  getMyLikedDestinations(@Req() req: any) {
    const userId = req.user.id;
    return this.destinationService.getLikedDestinations(userId);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.User, Role.Admin)
  @ApiOperation({ summary: 'Lấy địa điểm theo user ID' })
  @ApiParam({ name: 'userId', description: 'ID của user' })
  @ApiResponse({ status: 200, description: 'Địa điểm của user' })
  getUserDestinations(@Param('userId') ownerId: string, @Req() req: any) {
    const currentUserId = req.user.id;
    return this.destinationService.getUserDestinations(ownerId, currentUserId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.User, Role.Admin)
  @ApiOperation({
    summary: 'Xem chi tiết địa điểm',
    description:
      'Lấy thông tin chi tiết địa điểm, tự động tăng visitCount. Trả về isLiked=true nếu user đã like destination.',
  })
  @ApiParam({ name: 'id', description: 'ID của địa điểm' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết địa điểm',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy địa điểm' })
  getDestinationById(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.destinationService.getDestinationById(id, userId);
  }

  @Get(':id/hierarchy')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.User, Role.Admin)
  @ApiOperation({
    summary: 'Xem phân cấp địa điểm',
    description: `
    Xem cấu trúc cha-con của địa điểm.
    
    **Ví dụ:**
    - Ninh Bình (cha)
      - Tràng An (con)
      - Bái Đính (con)
      - Tam Cốc (con)
    `,
  })
  @ApiParam({ name: 'id', description: 'ID của địa điểm' })
  @ApiResponse({ status: 200, description: 'Cấu trúc phân cấp' })
  getHierarchy(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.destinationService.getDestinationHierarchy(id, userId);
  }

  @Get(':id/sub-locations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.User, Role.Admin)
  @ApiOperation({
    summary: 'Lấy các địa điểm con',
    description: `
    Lấy danh sách tất cả các địa điểm con nằm trong địa điểm cha.
    
    **Ví dụ:**
    - Địa điểm cha: Ninh Bình
    - Các địa điểm con: Tràng An, Bái Đính, Tam Cốc, Hang Múa, ...
    
    Mỗi địa điểm con sẽ có thông tin chi tiết và trường isLiked.
    `,
  })
  @ApiParam({ name: 'id', description: 'ID của địa điểm cha' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách địa điểm con với thông tin chi tiết',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy địa điểm cha',
  })
  getSubLocations(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.destinationService.getSubLocations(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FilesInterceptor('images'))
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cập nhật địa điểm (Chỉ Admin)',
    description:
      'Cập nhật thông tin địa điểm (chỉ Admin có role = 1 mới được sửa)',
  })
  @ApiBody({ type: UpdateDestinationDto })
  @ApiParam({ name: 'id', description: 'ID của địa điểm' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy địa điểm' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Chỉ Admin (role = 1) mới được sửa destination',
  })
  @Roles(Role.Admin)
  updateDestination(
    @Param('id') id: string,
    @Body() dto: any,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const groupedData = this.groupFormData(dto, UpdateDestinationDto);
    const updateDto = Object.assign(new UpdateDestinationDto(), groupedData);
    return this.destinationService.updateDestination(
      id,
      userId,
      updateDto,
      files,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Xóa địa điểm (Chỉ Admin)',
    description:
      'Xóa địa điểm (chỉ Admin có role = 1 mới được xóa. Không thể xóa nếu còn địa điểm con)',
  })
  @ApiParam({ name: 'id', description: 'ID của địa điểm' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy địa điểm' })
  @ApiResponse({
    status: 400,
    description: 'Không thể xóa địa điểm có sub-locations',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Chỉ Admin (role = 1) mới được xóa destination',
  })
  @Roles(Role.Admin)
  deleteDestination(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.destinationService.deleteDestination(id, userId);
  }

  // ========== LIKE ENDPOINTS ==========

  @Post(':id/like')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Like/Unlike địa điểm',
    description:
      'Toggle like cho địa điểm. Nếu đã like thì unlike, chưa like thì like',
  })
  @ApiParam({ name: 'id', description: 'ID của địa điểm' })
  @ApiResponse({
    status: 200,
    description: 'Like/Unlike thành công',
    schema: {
      example: {
        message: 'Liked destination',
        statusCode: 201,
        status: 'success',
        data: null,
      },
    },
  })
  @Roles(Role.User, Role.Admin)
  toggleLike(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.destinationService.toggleLike(id, userId);
  }

  // ========== REVIEW ENDPOINTS ==========

  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FilesInterceptor('images'))
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Đánh giá địa điểm',
    description: `
    Tạo hoặc cập nhật review cho địa điểm (mỗi user chỉ 1 review).
    
    **Lưu ý:**
    - rating: từ 1 đến 5 sao
    - comment: nội dung đánh giá (optional)
    - visitDate: ngày đến thăm (optional, format: YYYY-MM-DD)
    - images: ảnh kèm theo review (optional)
    `,
  })
  @ApiBody({ type: CreateDestinationReviewDto })
  @ApiParam({ name: 'id', description: 'ID của địa điểm' })
  @ApiResponse({
    status: 201,
    description: 'Review thành công',
    schema: {
      example: {
        message: 'Review created successfully',
        statusCode: 201,
        status: 'success',
        data: {
          id: 'uuid',
          rating: 4.5,
          comment: 'Beautiful place!',
          visitDate: '2025-09-15',
          imageUrl: ['url1', 'url2'],
          user: {
            id: 'uuid',
            username: 'user123',
            name: 'John Doe',
          },
        },
      },
    },
  })
  @Roles(Role.User, Role.Admin)
  createReview(
    @Param('id') id: string,
    @Body() dto: CreateDestinationReviewDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.destinationService.createOrUpdateReview(
      id,
      userId,
      dto.rating,
      dto.comment,
      dto.visitDate,
      files,
    );
  }

  @Get(':id/reviews')
  @ApiOperation({
    summary: 'Xem review địa điểm',
    description: 'Lấy tất cả review của địa điểm',
  })
  @ApiParam({ name: 'id', description: 'ID của địa điểm' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách review',
    schema: {
      example: {
        message: 'Reviews retrieved successfully',
        statusCode: 200,
        status: 'success',
        data: [
          {
            id: 'uuid',
            rating: 4.5,
            comment: 'Amazing place!',
            visitDate: '2025-09-15',
            imageUrl: [],
            user: {
              id: 'uuid',
              username: 'user123',
              name: 'John Doe',
            },
          },
        ],
      },
    },
  })
  getReviews(@Param('id') id: string) {
    return this.destinationService.getReviews(id);
  }

  @Delete(':id/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Xóa review',
    description: 'Xóa review của mình cho địa điểm này',
  })
  @ApiParam({ name: 'id', description: 'ID của địa điểm' })
  @ApiResponse({ status: 200, description: 'Xóa review thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy review' })
  @Roles(Role.User, Role.Admin)
  deleteReview(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.destinationService.deleteReview(id, userId);
  }

  // ========== ML/AI ENDPOINTS ==========

  @Post('ml/export-data')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Export dữ liệu để train ML model (Admin only)',
    description: `
    Export tất cả data từ MongoDB ra file JSON để train ML model:
    - User features (sở thích, hành vi)
    - Destination features
    - User-Destination interactions (view, like, post, review)
    
    **Files được tạo trong folder ml-exports/**
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Export thành công',
    schema: {
      example: {
        message: 'Data exported successfully',
        data: {
          userCount: 150,
          destinationCount: 500,
          interactionCount: 5000,
          exportDir: '/path/to/ml-exports',
          timestamp: '2025-10-03T15-30-00',
        },
      },
    },
  })
  @Roles(Role.Admin)
  async exportMLData() {
    const result = await this.mlDataExportService.exportTrainingData();
    return {
      message: 'Data exported successfully',
      data: {
        userCount: result.users.length,
        destinationCount: result.destinations.length,
        interactionCount: result.interactions.length,
        exportDir: result.exportDir,
        timestamp: result.timestamp,
      },
    };
  }

  @Get('ml/user-profile/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy user profile cho ML recommendation',
    description: 'Lấy toàn bộ thông tin sở thích và hành vi của user',
  })
  @ApiParam({ name: 'userId', description: 'ID của user' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @Roles(Role.User, Role.Admin)
  async getUserMLProfile(@Param('userId') userId: string) {
    const profile = await this.mlDataExportService.getUserProfile(userId);
    return {
      message: 'User profile retrieved successfully',
      data: profile,
    };
  }
}
