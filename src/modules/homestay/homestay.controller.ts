/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  UsePipes,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger';
import { HomestayService } from './homestay.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { CustomValidationPipe } from 'src/common/pipe/validation.pipe';
import { CreateHomestayDto } from './dto/create-homestay.dto';
import { CreateHomestayFilesDto } from './dto/create-homestay-files.dto';
import { UpdateHomestayDto } from './dto/update-homestay.dto';
import { SearchHomestayDto } from './dto/search-homestay.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateHomestayReviewDto } from './dto/create-homestay-review.dto';

@ApiTags('homestays')
@Controller('homestays')
@UsePipes(new CustomValidationPipe())
export class HomestayController {
  constructor(private readonly homestayService: HomestayService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Tạo homestay mới với ảnh' })
  @ApiResponse({ status: 201, description: 'Tạo homestay thành công' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @HttpCode(HttpStatus.CREATED)
  async createHomestay(
    @Req() req: any,
    @Body() dto: CreateHomestayFilesDto,
    @UploadedFiles() images?: Express.Multer.File[],
  ) {
    return this.homestayService.createHomestay(req.user.id, dto as any, images);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách homestay' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  @HttpCode(HttpStatus.OK)
  async getHomestays(@Query() query: SearchHomestayDto) {
    return this.homestayService.getHomestays(query);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Lấy homestay phổ biến' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  @HttpCode(HttpStatus.OK)
  async getPopularHomestays(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.homestayService.getPopularHomestays(limitNum);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Lấy homestay gần đây' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  @HttpCode(HttpStatus.OK)
  async getNearbyHomestays(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radius') radius?: string,
    @Query('limit') limit?: string,
  ) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusNum = radius ? parseInt(radius, 10) : 50;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    return this.homestayService.getNearbyHomestays(
      lat,
      lng,
      radiusNum,
      limitNum,
    );
  }

  @Get('my-bookings')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMyBookings(@Req() req: any, @Query('status') status?: string) {
    return this.homestayService.getUserBookings(req.user.id, status);
  }

  @Get('host-bookings')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getHostBookings(@Req() req: any, @Query('status') status?: string) {
    return this.homestayService.getHostBookings(req.user.id, status);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getHomestayById(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id as string;
    return this.homestayService.getHomestayById(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateHomestay(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateHomestayDto,
  ) {
    return this.homestayService.updateHomestay(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteHomestay(@Param('id') id: string, @Req() req: any) {
    return this.homestayService.deleteHomestay(id, req.user.id);
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async toggleFavorite(@Param('id') id: string, @Req() req: any) {
    return this.homestayService.toggleFavorite(id, req.user.id);
  }

  @Post('bookings')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createBooking(@Req() req: any, @Body() dto: CreateBookingDto) {
    return this.homestayService.createBooking(req.user.id, dto);
  }

  @Patch('bookings/:id/status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateBookingStatus(
    @Param('id') id: string,
    @Req() req: any,
    @Body('status') status: string,
  ) {
    return this.homestayService.updateBookingStatus(id, req.user.id, status);
  }

  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createReview(@Req() req: any, @Body() dto: CreateHomestayReviewDto) {
    return this.homestayService.createReview(req.user.id, dto);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Upload homestay images',
    description:
      'Upload multiple images for homestay from gallery or camera (max 10 files)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'id',
    description: 'Homestay ID',
    example: '6765adc7a2f5e8ef87ef0eaa',
  })
  @ApiResponse({ status: 200, description: 'Images uploaded successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid files or homestay not found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(FilesInterceptor('images', 10))
  @HttpCode(HttpStatus.OK)
  async uploadImages(
    @Param('id') id: string,
    @Req() req: any,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.homestayService.uploadImages(id, images, req.user.id);
  }

  @Patch(':id/images')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateImages(
    @Param('id') id: string,
    @Req() req: any,
    @Body('imageUrls') imageUrls: string[],
    @Body('coverImage') coverImage?: string,
  ) {
    return this.homestayService.updateImages(
      id,
      imageUrls,
      coverImage,
      req.user.id,
    );
  }

  @Delete(':id/images')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteImage(
    @Param('id') id: string,
    @Req() req: any,
    @Body('imageUrl') imageUrl: string,
  ) {
    return this.homestayService.deleteImage(id, imageUrl, req.user.id);
  }
}
