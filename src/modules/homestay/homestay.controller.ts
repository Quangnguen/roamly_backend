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
  // UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { HomestayService } from './homestay.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { CustomValidationPipe } from 'src/common/pipe/validation.pipe';
import { CreateHomestayDto } from './dto/create-homestay.dto';
import { UpdateHomestayDto } from './dto/update-homestay.dto';
import { SearchHomestayDto } from './dto/search-homestay.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateHomestayReviewDto } from './dto/create-homestay-review.dto';

@Controller('homestays')
@UsePipes(new CustomValidationPipe())
export class HomestayController {
  constructor(private readonly homestayService: HomestayService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 10))
  @HttpCode(HttpStatus.CREATED)
  async createHomestay(
    @Req() req: any,
    @Body() dto: CreateHomestayDto,
    // @UploadedFiles() images?: Express.Multer.File[],
  ) {
    return this.homestayService.createHomestay(req.user.id, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getHomestays(@Query() query: SearchHomestayDto) {
    return this.homestayService.getHomestays(query);
  }

  @Get('popular')
  @HttpCode(HttpStatus.OK)
  async getPopularHomestays(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.homestayService.getPopularHomestays(limitNum);
  }

  @Get('nearby')
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
}
