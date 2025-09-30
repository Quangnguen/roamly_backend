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
  // UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { DestinationService } from './destination.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { CustomValidationPipe } from 'src/common/pipe/validation.pipe';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { SearchDestinationDto } from './dto/search-destination.dto';

@Controller('destinations')
@UsePipes(new CustomValidationPipe())
export class DestinationController {
  constructor(private readonly destinationService: DestinationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 10))
  @HttpCode(HttpStatus.CREATED)
  async createDestination(
    @Req() req: any,
    @Body() dto: CreateDestinationDto,
    // @UploadedFiles() images?: Express.Multer.File[],
  ) {
    return this.destinationService.createDestination(req.user.id, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getDestinations(@Query() query: SearchDestinationDto) {
    return this.destinationService.getDestinations(query);
  }

  @Get('popular')
  @HttpCode(HttpStatus.OK)
  async getPopularDestinations(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.destinationService.getPopularDestinations(limitNum);
  }

  @Get('nearby')
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
}
