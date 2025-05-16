import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

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
        authorId,
        caption: dto.caption,
        imageUrl: imageUrls,
      },
    });

    return post;
  }

  async findAll() {
    return this.prisma.post.findMany();
  }
  async findById(id: string) {
    return this.prisma.post.findUnique({ where: { id } });
  }
  async update(
    postId: string,
    files: Express.Multer.File[],
    dto: UpdatePostDto,
  ) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    // Xoá ảnh cũ nếu có ảnh mới
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

    return this.prisma.post.update({
      where: { id: postId },
      data: {
        caption: dto.caption,
        imageUrl: imageUrls,
      },
    });
  }

  async delete(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    for (const url of post.imageUrl) {
      const publicId = this.cloudinary.extractPublicId(url);
      await this.cloudinary.deleteImage(`nestjs_uploads/${publicId}`);
    }

    return this.prisma.post.delete({ where: { id: postId } });
  }
}
