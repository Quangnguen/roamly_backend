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
  UseGuards,
  UsePipes,
  ForbiddenException,
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
  findAll() {
    return this.postsService.findAll();
  }
  @Get(':id')
  @Roles(Role.User, Role.Admin)
  async findById(@Param('id') id: string) {
    return this.postsService.findById(id);
  }
  @Get('my-posts')
  @Roles(Role.User, Role.Admin)
  async getMyPosts(@Req() req: any) {
    const userId = req.user.id;
    return this.postsService.getPostsByUserId(userId);
  }
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images'))
  async update(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UpdatePostDto,
    @Req() req: any,
  ) {
    const post = await this.postsService.findById(id);
    if (!post) throw new ForbiddenException('Post not found');

    return this.postsService.update(id, files, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    const post = await this.postsService.findById(id);
    if (!post) throw new ForbiddenException('Post not found');
    return this.postsService.delete(id);
  }
}
