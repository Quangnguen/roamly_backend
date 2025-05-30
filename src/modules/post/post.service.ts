import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { response } from '../../common/utils/response.utils';

@Injectable()
export class PostService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async create(
    authorId: string,
    files: Express.Multer.File[],
    dto: CreatePostDto,
  ) {
    const imageUrls = await this.cloudinary.uploadMultiple(files);

    const post = await this.prisma.post.create({
      data: {
        authorId: authorId,
        caption: dto.caption,
        imageUrl: imageUrls,
      },
    });

    return response('Tạo bài viết thành công', 201, 'success', post);
  }

  async findAll() {
    const posts = await this.prisma.post.findMany({
      include: {
        author: {
          select: {
            username: true,
            profilePic: true,
          },
        },
      },
    });

    return response('Lấy danh sách bài viết thành công', 200, 'success', posts);
  }

  async findById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            name: true,
            profilePic: true,
          },
        },
      },
    });

    if (!post) throw new NotFoundException('Không tìm thấy bài viết');

    return response('Lấy bài viết thành công', 200, 'success', post);
  }

  async getPostsByUserId(userId: string) {
    const posts = await this.prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            name: true,
            profilePic: true,
          },
        },
      },
    });

    return response(
      'Lấy bài viết theo người dùng thành công',
      200,
      'success',
      posts,
    );
  }

  async update(
    postId: string,
    files: Express.Multer.File[],
    dto: UpdatePostDto,
  ) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');

    if (files.length > 0 && post.imageUrl.length > 0) {
      for (const url of post.imageUrl) {
        const publicId = this.cloudinary.extractPublicId(url);
        await this.cloudinary.deleteImage(`nestjs_uploads/${publicId}`);
      }
    }

    const imageUrls =
      files.length > 0
        ? await this.cloudinary.uploadMultiple(files)
        : post.imageUrl;

    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: {
        caption: dto.caption,
        imageUrl: imageUrls,
      },
    });

    return response(
      'Cập nhật bài viết thành công',
      200,
      'success',
      updatedPost,
    );
  }

  async delete(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');

    for (const url of post.imageUrl) {
      const publicId = this.cloudinary.extractPublicId(url);
      await this.cloudinary.deleteImage(`nestjs_uploads/${publicId}`);
    }

    await this.prisma.post.delete({ where: { id: postId } });

    return response('Xoá bài viết thành công', 200, 'success');
  }
}
