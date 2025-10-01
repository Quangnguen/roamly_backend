/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
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
import { DestinationService } from './destination.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { CustomValidationPipe } from 'src/common/pipe/validation.pipe';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';

import { SearchDestinationDto } from './dto/search-destination.dto';

@ApiTags('destinations')
@Controller('destinations')
@UsePipes(new CustomValidationPipe())
export class DestinationController {
  constructor(private readonly destinationService: DestinationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create destination with image upload',
    description:
      'Create a new travel destination with multiple image uploads from gallery or camera',
  })
  @ApiResponse({ status: 201, description: 'Destination created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.CREATED)
  async createDestination(
    @Req() req: any,
    @Body() dto: CreateDestinationDto,
    @UploadedFiles() images?: Express.Multer.File[],
  ) {
    return this.destinationService.createDestination(req.user.id, dto, images);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách địa điểm du lịch' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  @HttpCode(HttpStatus.OK)
  async getDestinations(@Query() query: SearchDestinationDto) {
    return this.destinationService.getDestinations(query);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Lấy địa điểm du lịch phổ biến' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  @HttpCode(HttpStatus.OK)
  async getPopularDestinations(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.destinationService.getPopularDestinations(limitNum);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Lấy địa điểm du lịch gần đây' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  @HttpCode(HttpStatus.OK)
  async getNearbyDestinations(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radius') radius?: string,
    @Query('limit') limit?: string,
  ) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusNum = radius ? parseInt(radius, 10) : 50;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    return this.destinationService.getNearbyDestinations(
      lat,
      lng,
      radiusNum,
      limitNum,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getDestinationById(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id as string;
    return this.destinationService.getDestinationById(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateDestination(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateDestinationDto,
  ) {
    return this.destinationService.updateDestination(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteDestination(@Param('id') id: string, @Req() req: any) {
    return this.destinationService.deleteDestination(id, req.user.id);
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async toggleFavorite(@Param('id') id: string, @Req() req: any) {
    return this.destinationService.toggleFavorite(id, req.user.id);
  }

  @Post(':id/checkin')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async checkinDestination(@Param('id') id: string, @Req() req: any) {
    return this.destinationService.checkinDestination(id, req.user.id);
  }

  @Post(':id/upload-images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload destination images',
    description:
      'Upload multiple images for a destination from gallery or camera (max 10 files)',
  })
  @ApiParam({
    name: 'id',
    description: 'Destination ID',
    example: '6765adc7a2f5e8ef87ef0eaa',
  })
  @ApiResponse({ status: 200, description: 'Images uploaded successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid files or destination not found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles() images: Express.Multer.File[],
    @Req() req: any,
  ) {
    return this.destinationService.uploadImages(id, images, req.user.id);
  }

  @Patch(':id/images')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateImages(
    @Param('id') id: string,
    @Body() body: { images: string[]; coverImage?: string },
    @Req() req: any,
  ) {
    return this.destinationService.updateImages(
      id,
      body.images,
      body.coverImage,
      req.user.id,
    );
  }

  @Delete(':id/images/:imageUrl')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteImage(
    @Param('id') id: string,
    @Param('imageUrl') imageUrl: string,
    @Req() req: any,
  ) {
    return this.destinationService.deleteImage(
      id,
      decodeURIComponent(imageUrl),
      req.user.id,
    );
  }
}
