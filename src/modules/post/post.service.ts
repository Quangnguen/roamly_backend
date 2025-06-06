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

  async findAll(userId: string) {
    // Lấy danh sách bài viết
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

    const postIds = posts.map((post) => post.id);

    const likeCounts = await this.prisma.like.groupBy({
      by: ['targetId'],
      where: {
        targetId: { in: postIds },
        type: 'post',
      },
      _count: {
        targetId: true,
      },
    });

    const likeCountMap = new Map(
      likeCounts.map((item) => [item.targetId, item._count.targetId]),
    );
    const userLikes = await this.prisma.like.findMany({
      where: {
        userId: userId,
        targetId: { in: postIds },
        type: 'post',
      },
      select: { targetId: true },
    });

    const likedPostIds = new Set(userLikes.map((like) => like.targetId));

    const postsWithLikes = posts.map((post) => ({
      ...post,
      likeCount: likeCountMap.get(post.id) || 0,
      isLike: likedPostIds.has(post.id),
    }));

    return response(
      'Lấy danh sách bài viết thành công',
      200,
      'success',
      postsWithLikes,
    );
  }

  async findById(userId: string, id: string) {
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

    const likeCount = await this.prisma.like.count({
      where: {
        targetId: id,
        type: 'post',
      },
    });

    const userLike = await this.prisma.like.findFirst({
      where: {
        userId: userId,
        targetId: id,
        type: 'post',
      },
    });

    return response('Lấy bài viết thành công', 200, 'success', {
      ...post,
      likeCount,
      isLike: !!userLike,
    });
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

    const postIds = posts.map((post) => post.id);

    const likeCounts = await this.prisma.like.groupBy({
      by: ['targetId'],
      where: {
        targetId: { in: postIds },
        type: 'post',
      },
      _count: {
        targetId: true,
      },
    });

    const likeCountMap = new Map(
      likeCounts.map((item) => [item.targetId, item._count.targetId]),
    );
    const userLikes = await this.prisma.like.findMany({
      where: {
        userId: userId,
        targetId: { in: postIds },
        type: 'post',
      },
      select: { targetId: true },
    });

    const likedPostIds = new Set(userLikes.map((like) => like.targetId));

    const postsWithLikes = posts.map((post) => ({
      ...post,
      likeCount: likeCountMap.get(post.id) || 0,
      isLike: likedPostIds.has(post.id),
    }));

    return response(
      'Lấy bài viết theo người dùng thành công',
      200,
      'success',
      postsWithLikes,
    );
  }

  async update(
    postId: string,
    files: Express.Multer.File[],
    dto: UpdatePostDto,
  ) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    let currentImages = [...post.imageUrl];

    if (dto.removedImages && dto.removedImages.length > 0) {
      for (const url of dto.removedImages) {
        const publicId = this.cloudinary.extractPublicId(url);
        await this.cloudinary.deleteImage(`nestjs_uploads/${publicId}`);

        currentImages = currentImages.filter((img) => img !== url);
      }
    }

    if (files.length > 0) {
      const newImageUrls = await this.cloudinary.uploadMultiple(files);
      currentImages = [...currentImages, ...newImageUrls];
    }

    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: {
        caption: dto.caption,
        imageUrl: currentImages,
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
