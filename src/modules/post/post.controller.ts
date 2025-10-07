/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UploadedFiles,
  UseInterceptors,
  Req,
  Query,
  UseGuards,
  UsePipes,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { CustomValidationPipe } from 'src/common/pipe/validation.pipe';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { RolesGuard } from 'src/common/guard/roles.guard';

@Controller('posts')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new CustomValidationPipe())
export class PostController {
  constructor(private readonly postsService: PostService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  @Roles(Role.User, Role.Admin)
  create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CreatePostDto,
    @Req() req: any,
  ) {
    console.log('Files received:', files); // Kiểm tra tệp nhận được
    console.log('DTO received:', dto);
    const authorId = req.user.id;
    return this.postsService.create(authorId, files, dto);
  }

  @Get()
  @Roles(Role.User, Role.Admin)
  async findAll(@Req() req: any) {
    const userId = req.user.id;
    return this.postsService.findAll(userId);
  }

  @Get('by-destination')
  @Roles(Role.User, Role.Admin)
  async findByDestination(
    @Req() req: any,
    @Query('destinationId') destinationId: string,
  ) {
    const userId = req.user.id;
    return await this.postsService.findByDestination(userId, destinationId);
  }

  @Get('by-homestay')
  @Roles(Role.User, Role.Admin)
  async findByHomestay(
    @Req() req: any,
    @Query('homestayId') homestayId: string,
  ) {
    const userId = req.user.id;
    return await this.postsService.findByHomestay(userId, homestayId);
  }

  @Get('feed')
  @Roles(Role.User, Role.Admin)
  async getFeed(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const userId = req.user.id;
    return this.postsService.getFeed(userId, page, limit);
  }

  @Get('my-posts')
  @Roles(Role.User, Role.Admin)
  async getMyPosts(@Req() req: any) {
    const userId = req.user.id;
    return this.postsService.getPostsByUserId(userId);
  }

  @Get('get-posts/:userId')
  @Roles(Role.User, Role.Admin)
  async getPostsByUserId(@Param('userId') userId: string) {
    return this.postsService.getPostsByUserId(userId);
  }
  // src/modules/post/post.controller.ts
  @Get('search')
  async search(
    @Req() req,
    @Query('q') q: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const parsedLimit = parseInt(limit) || 20;
    const take = parseInt(page) || 1;
    return this.postsService.searchPosts(q, req.user.id, take, parsedLimit);
  }

  @Get(':id')
  @Roles(Role.User, Role.Admin)
  async findById(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.postsService.findById(userId, id);
  }
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images'))
  async update(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UpdatePostDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.postsService.update(id, userId, files, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    const post = await this.postsService.findById(userId, id);
    if (!post)
      throw new ForbiddenException('Bạn không có quyền xoá bài viết này');

    return this.postsService.delete(id);
  }
}
