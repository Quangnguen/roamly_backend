import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { response } from '../../common/utils/response.utils';
import { FollowService } from '../follow/follow.service';
import { isToday } from 'date-fns';
import { SocketGateway } from '../socket/socket.gateway';
@Injectable()
export class PostService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
    private followService: FollowService,
    private socketGateway: SocketGateway,
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

    const followers = await this.followService.getFollowers(authorId);
    for (const follower of followers.data ?? []) {
      this.socketGateway.emitToUser(follower.id, 'new_post', post);
    }

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
  // async getFeed(userId: string, page = 1, limit = 10) {
  //   const skip = (page - 1) * limit;

  //   const followingIds = await this.followService.getFollowingRawIds(userId);
  //   const visibleIds = [...followingIds, userId];

  //   const followingPosts = await this.prisma.post.findMany({
  //     where: {
  //       authorId: { in: visibleIds },
  //     },
  //     include: {
  //       author: {
  //         select: {
  //           username: true,
  //           profilePic: true,
  //         },
  //       },
  //       _count: {
  //         select: {
  //           likes: true,
  //           comments: true,
  //         },
  //       },
  //     },
  //     orderBy: {
  //       createdAt: 'desc',
  //     },
  //     skip,
  //     take: limit,
  //   });

  //   const hotPosts = await this.prisma.post.findMany({
  //     where: {
  //       authorId: { notIn: visibleIds },
  //     },
  //     include: {
  //       author: {
  //         select: {
  //           username: true,
  //           profilePic: true,
  //         },
  //       },
  //       _count: {
  //         select: {
  //           likes: true,
  //           comments: true,
  //         },
  //       },
  //     },
  //     orderBy: {
  //       likes: { _count: 'desc' },
  //     },
  //     take: 5,
  //   });

  //   const combinedPosts = [...followingPosts, ...hotPosts];
  //   const postIds = combinedPosts.map((p) => p.id);

  //   const userLikes = await this.prisma.like.findMany({
  //     where: {
  //       userId,
  //       targetId: { in: postIds },
  //       type: 'post',
  //     },
  //   });
  //   const likedSet = new Set(userLikes.map((like) => like.targetId));

  //   const postsWithScore = combinedPosts.map((post) => {
  //     const hoursSince =
  //       (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60) ||
  //       1;

  //     const score =
  //       (post._count.likes * 2 +
  //         post._count.comments * 3 +
  //         (visibleIds.includes(post.authorId) ? 5 : 0)) /
  //       hoursSince;

  //     return {
  //       ...post,
  //       score,
  //       isLike: likedSet.has(post.id),
  //     };
  //   });

  //   postsWithScore.sort((a, b) => b.score - a.score);

  //   return response('Trang chủ', 200, 'success', postsWithScore);
  // }
  isToday(date: Date) {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  async getFeed(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const followingIds = await this.followService.getFollowingRawIds(userId);
    const visibleIds = [...followingIds, userId];

    const posts = await this.prisma.post.findMany({
      include: {
        author: { select: { username: true, profilePic: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200, // tăng nếu muốn nguồn đa dạng hơn
    });

    const postIds = posts.map((p) => p.id);

    const userLikes = await this.prisma.like.findMany({
      where: {
        userId,
        targetId: { in: postIds },
        type: 'post',
      },
    });
    const likedSet = new Set(userLikes.map((l) => l.targetId));

    const now = Date.now();

    const scoredPosts = posts.map((post) => {
      const createdAt = new Date(post.createdAt);
      const hoursSince = Math.max(
        (now - createdAt.getTime()) / (1000 * 60 * 60),
        1,
      );
      const isFollowing = followingIds.includes(post.authorId);
      const isSelf = post.authorId === userId;
      const isTodayPost = isToday(createdAt);

      const bonus = isTodayPost ? 30 : 0;

      const score =
        (post._count.likes * 2 +
          post._count.comments * 3 +
          (isFollowing ? 5 : 0) +
          bonus) /
        hoursSince;

      return {
        ...post,
        score,
        isLike: likedSet.has(post.id),
        isToday: isTodayPost,
        isFollowing,
        isSelf,
      };
    });

    const group1 = scoredPosts.filter(
      (p) => p.isToday && (p.isFollowing || p.isSelf),
    );

    const group2 = scoredPosts
      .filter((p) => !group1.includes(p))
      .filter((p) => {
        const postDate = new Date(p.createdAt);
        const diffHours = (now - postDate.getTime()) / (1000 * 60 * 60);
        return diffHours <= 48;
      });

    const group3 = scoredPosts.filter(
      (p) => !group1.includes(p) && !group2.includes(p),
    );

    const finalFeed = [
      ...group1.sort((a, b) => b.score - a.score),
      ...group2.sort((a, b) => b.score - a.score),
      ...group3.sort((a, b) => b.score - a.score),
    ];

    const paginatedPosts = finalFeed.slice(skip, skip + limit);

    return response('Feed', 200, 'success', paginatedPosts);
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
    userId: string,
    files: Express.Multer.File[],
    dto: UpdatePostDto,
  ) {
    if (dto.removedImages && typeof dto.removedImages === 'string') {
      try {
        dto.removedImages = JSON.parse(dto.removedImages);
      } catch (e) {
        console.error('Failed to parse removedImages:', e);
        dto.removedImages = [];
      }
    }
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    if (post.authorId !== userId)
      throw new ForbiddenException('Bạn không có quyền cập nhật bài viết này');
    if (dto.removedImages && dto.removedImages.length > 0) {
      for (const url of dto.removedImages) {
        const publicId = this.cloudinary.extractPublicId(url);
        await this.cloudinary.deleteImage(publicId);
      }
    }
    let currentImages = post.imageUrl.filter(
      (img) => !dto.removedImages?.includes(img),
    );
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
