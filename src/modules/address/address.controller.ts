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
  UseInterceptors,
  UploadedFiles,
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
import { AddressService } from './address.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { CustomValidationPipe } from 'src/common/pipe/validation.pipe';
import { CreateAddressDto } from './dto/create-address.dto';
import { CreateAddressFilesDto } from './dto/create-address-files.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { SearchAddressDto } from './dto/search-address.dto';
import { UpdateImagesDto } from './dto/update-images.dto';

@ApiTags('addresses')
@Controller('addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create new address with images',
    description:
      'Create address/location with images from gallery or camera (max 10 files)',
  })
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UsePipes(new CustomValidationPipe())
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createAddressDto: CreateAddressFilesDto,
    @Req() req: any,
    @UploadedFiles() images?: Express.Multer.File[],
  ) {
    return this.addressService.create(
      createAddressDto as any,
      req.user.id as string,
      images,
    );
  }

  @Get()
  @UsePipes(new CustomValidationPipe())
  async findAll(@Query() searchAddressDto: SearchAddressDto) {
    return this.addressService.findAll(searchAddressDto);
  }

  @Get('popular')
  async getPopular(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.addressService.getPopular(limitNum);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.addressService.findBySlug(slug);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.addressService.findOne(id);
  }

  @Get(':id/hierarchy')
  async getHierarchy(@Param('id') id: string) {
    return this.addressService.getHierarchy(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new CustomValidationPipe())
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.addressService.update(id, updateAddressDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.addressService.remove(id);
  }

  @Post(':id/upload-images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Upload address images',
    description:
      'Upload multiple images for address/location from gallery or camera (max 10 files)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'id',
    description: 'Address ID',
    example: '6765adc7a2f5e8ef87ef0eaa',
  })
  @ApiResponse({ status: 200, description: 'Images uploaded successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid files or address not found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(FilesInterceptor('images', 10))
  @HttpCode(HttpStatus.OK)
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles() images: Express.Multer.File[],
    @Req() req: any,
  ) {
    return this.addressService.uploadImages(id, images, req.user.id as string);
  }

  @Patch(':id/images')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new CustomValidationPipe())
  @HttpCode(HttpStatus.OK)
  async updateImages(
    @Param('id') id: string,
    @Body() updateImagesDto: UpdateImagesDto,
    @Req() req: any,
  ) {
    return this.addressService.updateImages(
      id,
      updateImagesDto.images,
      updateImagesDto.coverImage,
      req.user.id as string,
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
    return this.addressService.deleteImage(
      id,
      decodeURIComponent(imageUrl),
      req.user.id as string,
    );
  }
}
