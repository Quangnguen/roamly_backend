/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { SearchDestinationDto } from './dto/search-destination.dto';
import { response } from '../../common/utils/response.utils';

@Injectable()
export class DestinationService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async createDestination(
    userId: string,
    files: Express.Multer.File[],
    dto: CreateDestinationDto,
  ) {
    try {
      // Check duplicate destination by title and location
      const existing = await this.prisma.destination.findFirst({
        where: {
          title: dto.title,
          location: dto.location,
        },
      });

      if (existing) {
        throw new BadRequestException(
          'Destination with same title and location already exists',
        );
      }

      // Validate parent if provided
      if (dto.parentId) {
        const parent = await this.prisma.destination.findUnique({
          where: { id: dto.parentId },
        });
        if (!parent) {
          throw new NotFoundException('Parent destination not found');
        }
      }

      // Upload images to cloudinary
      let imageUrls: string[] = [];
      if (files && files.length > 0) {
        const uploadPromises = files.map((file) =>
          this.cloudinary.uploadImage(file),
        );
        const results = await Promise.all(uploadPromises);
        imageUrls = results.map((result) => result.secure_url);
      }

      const destination = await this.prisma.destination.create({
        data: {
          title: dto.title,
          description: dto.description,
          location: dto.location,
          city: dto.city,
          country: dto.country,
          latitude: dto.latitude,
          longitude: dto.longitude,
          category: dto.category || [],
          imageUrl: imageUrls,
          tags: dto.tags || [],
          bestTimeToVisit: dto.bestTimeToVisit,
          entryFee: dto.entryFee as any,
          openingHours: dto.openingHours,
          facilities: dto.facilities || [],
          activities: dto.activities || [],
          travelTips: dto.travelTips || [],
          parentId: dto.parentId,
          isPublic: dto.isPublic ?? true,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              profilePic: true,
            },
          },
          parent: {
            select: {
              id: true,
              title: true,
              location: true,
            },
          },
        },
      });

      return response(
        'Destination created successfully',
        201,
        'success',
        destination,
      );
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  async getDestinations(searchDto: SearchDestinationDto, userId?: string) {
    try {
      const { keyword, page = 1, limit = 20 } = searchDto;

      const where: any = {
        isPublic: true,
      };

      // Simple keyword search
      if (keyword) {
        where.OR = [
          { title: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
          { location: { contains: keyword, mode: 'insensitive' } },
        ];
      }

      const skip = (page - 1) * limit;

      const [destinations, total] = await Promise.all([
        this.prisma.destination.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                profilePic: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.destination.count({ where }),
      ]);

      // Add isLiked field for current user (like post module)
      const destinationIds = destinations.map((dest) => dest.id);
      const userLikes = await this.prisma.like.findMany({
        where: {
          userId,
          targetId: { in: destinationIds },
          type: 'destination',
        },
      });

      const likedDestinationIds = new Set(
        userLikes.map((like) => like.targetId),
      );
      const destinationsWithLikes = destinations.map((dest) => ({
        ...dest,
        isLiked: likedDestinationIds.has(dest.id),
      }));

      return response('Destinations retrieved successfully', 200, 'success', {
        destinations: destinationsWithLikes,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  async getDestinationById(id: string, userId: string) {
    try {
      const destination = await this.prisma.destination.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              profilePic: true,
            },
          },
          parent: {
            select: {
              id: true,
              title: true,
              location: true,
              imageUrl: true,
            },
          },
          subLocations: {
            select: {
              id: true,
              title: true,
              location: true,
              imageUrl: true,
              visitCount: true,
              likeCount: true,
            },
          },
        },
      });

      if (!destination) {
        throw new NotFoundException('Destination not found');
      }

      // Track unique view with upsert (mỗi user chỉ tính 1 lần)
      await this.prisma.destinationView.upsert({
        where: {
          destinationId_userId: {
            destinationId: id,
            userId: userId,
          },
        },
        update: {
          viewedAt: new Date(), // Update thời gian xem gần nhất
        },
        create: {
          destinationId: id,
          userId: userId,
        },
      });

      // Sync visitCount từ unique views (chạy async, không chờ)
      this.prisma.destination
        .update({
          where: { id },
          data: {
            visitCount: await this.prisma.destinationView.count({
              where: { destinationId: id },
            }),
          },
        })
        .catch(() => {
          // Silent fail - không ảnh hưởng response
        });

      // Add isLiked field for current user (like post module - always has userId)
      const userLike = await this.prisma.like.findUnique({
        where: {
          userId_targetId_type: {
            userId,
            targetId: id,
            type: 'destination',
          },
        },
      });
      const isLiked = !!userLike;

      return response('Destination retrieved successfully', 200, 'success', {
        ...destination,
        isLiked,
      });
    } catch (error: any) {
      throw error;
    }
  }

  async updateDestination(
    id: string,
    userId: string,
    dto: UpdateDestinationDto,
    files?: Express.Multer.File[],
  ) {
    try {
      const destination = await this.prisma.destination.findUnique({
        where: { id },
      });

      if (!destination) {
        throw new NotFoundException('Destination not found');
      }

      if (destination.userId !== userId) {
        throw new BadRequestException(
          'You can only update your own destinations',
        );
      }

      // Validate parent if changing
      // Check if parentId is being updated (including setting to null)
      if ('parentId' in dto && dto.parentId !== destination.parentId) {
        // If setting a new parent (not null)
        if (dto.parentId !== null) {
          const parent = await this.prisma.destination.findUnique({
            where: { id: dto.parentId },
          });
          if (!parent) {
            throw new NotFoundException('Parent destination not found');
          }
          // Prevent circular reference
          if (dto.parentId === id) {
            throw new BadRequestException(
              'Destination cannot be its own parent',
            );
          }
        }
        // If setting to null, just allow it (removing parent)
      }

      // Upload new images if provided
      let newImageUrls: string[] = [];
      if (files && files.length > 0) {
        const uploadPromises = files.map((file) =>
          this.cloudinary.uploadImage(file),
        );
        const results = await Promise.all(uploadPromises);
        newImageUrls = results.map((result) => result.secure_url);
      }

      const updateData: any = { ...dto };
      if (newImageUrls.length > 0) {
        updateData.imageUrl = [...destination.imageUrl, ...newImageUrls];
      }

      const updated = await this.prisma.destination.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              profilePic: true,
            },
          },
          parent: {
            select: {
              id: true,
              title: true,
              location: true,
            },
          },
        },
      });

      return response(
        'Destination updated successfully',
        200,
        'success',
        updated,
      );
    } catch (error: any) {
      throw error;
    }
  }

  async deleteDestination(id: string, userId: string) {
    try {
      const destination = await this.prisma.destination.findUnique({
        where: { id },
        include: {
          subLocations: true,
        },
      });

      if (!destination) {
        throw new NotFoundException('Destination not found');
      }

      if (destination.userId !== userId) {
        throw new BadRequestException(
          'You can only delete your own destinations',
        );
      }

      // Check if has sub-locations
      if (destination.subLocations.length > 0) {
        throw new BadRequestException(
          'Cannot delete destination with sub-locations. Delete sub-locations first.',
        );
      }

      await this.prisma.destination.delete({ where: { id } });

      return response('Destination deleted successfully', 200, 'success', null);
    } catch (error: any) {
      throw error;
    }
  }

  async getUserDestinations(ownerId: string, currentUserId: string) {
    try {
      const destinations = await this.prisma.destination.findMany({
        where: { userId: ownerId },
        include: {
          parent: {
            select: {
              id: true,
              title: true,
              location: true,
            },
          },
          subLocations: {
            select: {
              id: true,
              title: true,
              location: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Add isLiked field
      const destinationIds = destinations.map((dest) => dest.id);
      const userLikes = await this.prisma.like.findMany({
        where: {
          userId: currentUserId,
          targetId: { in: destinationIds },
          type: 'destination',
        },
      });

      const likedDestinationIds = new Set(
        userLikes.map((like) => like.targetId),
      );
      const destinationsWithLikes = destinations.map((dest) => ({
        ...dest,
        isLiked: likedDestinationIds.has(dest.id),
      }));

      return response(
        'User destinations retrieved successfully',
        200,
        'success',
        destinationsWithLikes,
      );
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  async getLikedDestinations(userId: string) {
    try {
      // Get all destination likes for the user
      const likes = await this.prisma.like.findMany({
        where: {
          userId,
          type: 'destination',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (likes.length === 0) {
        return response('No liked destinations found', 200, 'success', []);
      }

      // Get destination IDs from likes
      const destinationIds = likes.map((like) => like.targetId);

      // Fetch full destination data
      const destinations = await this.prisma.destination.findMany({
        where: {
          id: { in: destinationIds },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              profilePic: true,
            },
          },
          parent: {
            select: {
              id: true,
              title: true,
              location: true,
            },
          },
          subLocations: {
            select: {
              id: true,
              title: true,
              location: true,
            },
          },
        },
      });

      // Sort destinations by like order and add isLiked field (always true)
      const likeOrderMap = new Map(
        likes.map((like, index) => [like.targetId, index]),
      );
      const sortedDestinations = destinations
        .sort((a, b) => {
          const orderA = likeOrderMap.get(a.id) ?? Number.MAX_VALUE;
          const orderB = likeOrderMap.get(b.id) ?? Number.MAX_VALUE;
          return orderA - orderB;
        })
        .map((dest) => ({
          ...dest,
          isLiked: true,
        }));

      return response(
        'Liked destinations retrieved successfully',
        200,
        'success',
        sortedDestinations,
      );
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  async getPopularDestinations(limit: number = 10, userId: string) {
    try {
      const destinations = await this.prisma.destination.findMany({
        where: { isPublic: true },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              profilePic: true,
            },
          },
          subLocations: {
            select: {
              id: true,
              title: true,
              location: true,
              imageUrl: true,
            },
            take: 5,
          },
        },
        orderBy: [
          { visitCount: 'desc' },
          { likeCount: 'desc' },
          { reviewCount: 'desc' },
        ],
        take: limit,
      });

      // Add isLiked field
      const destinationIds = destinations.map((dest) => dest.id);
      const userLikes = await this.prisma.like.findMany({
        where: {
          userId,
          targetId: { in: destinationIds },
          type: 'destination',
        },
      });

      const likedDestinationIds = new Set(
        userLikes.map((like) => like.targetId),
      );
      const destinationsWithLikes = destinations.map((dest) => ({
        ...dest,
        isLiked: likedDestinationIds.has(dest.id),
      }));

      return response(
        'Popular destinations retrieved successfully',
        200,
        'success',
        destinationsWithLikes,
      );
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  async getDestinationHierarchy(id: string, userId: string) {
    try {
      const destination = await this.prisma.destination.findUnique({
        where: { id },
        include: {
          parent: {
            include: {
              parent: {
                include: {
                  parent: true,
                },
              },
            },
          },
          subLocations: {
            include: {
              subLocations: true,
            },
          },
        },
      });

      if (!destination) {
        throw new NotFoundException('Destination not found');
      }

      // Add isLiked for main destination
      const userLike = await this.prisma.like.findUnique({
        where: {
          userId_targetId_type: {
            userId,
            targetId: id,
            type: 'destination',
          },
        },
      });

      return response(
        'Destination hierarchy retrieved successfully',
        200,
        'success',
        {
          ...destination,
          isLiked: !!userLike,
        },
      );
    } catch (error: any) {
      throw error;
    }
  }

  async getSubLocations(parentId: string, userId: string) {
    try {
      // Check if parent destination exists
      const parent = await this.prisma.destination.findUnique({
        where: { id: parentId },
        select: {
          id: true,
          title: true,
          location: true,
        },
      });

      if (!parent) {
        throw new NotFoundException('Parent destination not found');
      }

      // Get all sub-locations of the parent
      const subLocations = await this.prisma.destination.findMany({
        where: { parentId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              profilePic: true,
            },
          },
          parent: {
            select: {
              id: true,
              title: true,
              location: true,
            },
          },
          subLocations: {
            select: {
              id: true,
              title: true,
              location: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Add isLiked field for parent and each sub-location
      const allDestinationIds = [
        parentId,
        ...subLocations.map((loc) => loc.id),
      ];
      const userLikes = await this.prisma.like.findMany({
        where: {
          userId,
          targetId: { in: allDestinationIds },
          type: 'destination',
        },
      });

      const likedLocationIds = new Set(userLikes.map((like) => like.targetId));

      // Add isLiked to parent
      const parentWithLike = {
        ...parent,
        isLiked: likedLocationIds.has(parentId),
      };

      // Add isLiked to sub-locations
      const subLocationsWithLikes = subLocations.map((loc) => ({
        ...loc,
        isLiked: likedLocationIds.has(loc.id),
      }));

      return response('Sub-locations retrieved successfully', 200, 'success', {
        parent: parentWithLike,
        subLocations: subLocationsWithLikes,
        total: subLocationsWithLikes.length,
      });
    } catch (error: any) {
      throw error;
    }
  }

  // Like/Unlike destination
  async toggleLike(destinationId: string, userId: string) {
    try {
      const destination = await this.prisma.destination.findUnique({
        where: { id: destinationId },
      });

      if (!destination) {
        throw new NotFoundException('Destination not found');
      }

      const existingLike = await this.prisma.like.findUnique({
        where: {
          userId_targetId_type: {
            userId,
            targetId: destinationId,
            type: 'destination',
          },
        },
      });

      if (existingLike) {
        // Unlike
        await this.prisma.like.delete({ where: { id: existingLike.id } });
        await this.prisma.destination.update({
          where: { id: destinationId },
          data: { likeCount: { decrement: 1 } },
        });
        return response('Unliked destination', 200, 'success', null);
      } else {
        // Like
        await this.prisma.like.create({
          data: {
            userId,
            targetId: destinationId,
            type: 'destination',
          },
        });
        await this.prisma.destination.update({
          where: { id: destinationId },
          data: { likeCount: { increment: 1 } },
        });
        return response('Liked destination', 201, 'success', null);
      }
    } catch (error: any) {
      throw error;
    }
  }

  // Create or update review
  async createOrUpdateReview(
    destinationId: string,
    userId: string,
    rating: number,
    comment?: string,
    visitDate?: string,
    files?: Express.Multer.File[],
  ) {
    try {
      const destination = await this.prisma.destination.findUnique({
        where: { id: destinationId },
      });

      if (!destination) {
        throw new NotFoundException('Destination not found');
      }

      // Upload images
      let imageUrls: string[] = [];
      if (files && files.length > 0) {
        const uploadPromises = files.map((file) =>
          this.cloudinary.uploadImage(file),
        );
        const results = await Promise.all(uploadPromises);
        imageUrls = results.map((result) => result.secure_url);
      }

      const existingReview = await this.prisma.destinationReview.findUnique({
        where: {
          destinationId_userId: {
            destinationId,
            userId,
          },
        },
      });

      let review;
      if (existingReview) {
        // Update existing review
        review = await this.prisma.destinationReview.update({
          where: { id: existingReview.id },
          data: {
            rating,
            comment,
            visitDate: visitDate ? new Date(visitDate) : undefined,
            imageUrl: imageUrls.length > 0 ? imageUrls : undefined,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                profilePic: true,
              },
            },
          },
        });
      } else {
        // Create new review
        review = await this.prisma.destinationReview.create({
          data: {
            destinationId,
            userId,
            rating,
            comment,
            visitDate: visitDate ? new Date(visitDate) : undefined,
            imageUrl: imageUrls,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                profilePic: true,
              },
            },
          },
        });

        await this.prisma.destination.update({
          where: { id: destinationId },
          data: { reviewCount: { increment: 1 } },
        });
      }

      // Recalculate average rating
      const allReviews = await this.prisma.destinationReview.findMany({
        where: { destinationId },
      });
      const avgRating =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      await this.prisma.destination.update({
        where: { id: destinationId },
        data: { rating: avgRating },
      });

      return response(
        existingReview
          ? 'Review updated successfully'
          : 'Review created successfully',
        existingReview ? 200 : 201,
        'success',
        review,
      );
    } catch (error: any) {
      throw error;
    }
  }

  // Get reviews
  async getReviews(destinationId: string) {
    try {
      const reviews = await this.prisma.destinationReview.findMany({
        where: { destinationId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              profilePic: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return response(
        'Reviews retrieved successfully',
        200,
        'success',
        reviews,
      );
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  // Delete review
  async deleteReview(destinationId: string, userId: string) {
    try {
      const review = await this.prisma.destinationReview.findUnique({
        where: {
          destinationId_userId: {
            destinationId,
            userId,
          },
        },
      });

      if (!review) {
        throw new NotFoundException('Review not found');
      }

      await this.prisma.destinationReview.delete({ where: { id: review.id } });

      await this.prisma.destination.update({
        where: { id: destinationId },
        data: { reviewCount: { decrement: 1 } },
      });

      // Recalculate rating
      const allReviews = await this.prisma.destinationReview.findMany({
        where: { destinationId },
      });

      const avgRating =
        allReviews.length > 0
          ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
          : 0;

      await this.prisma.destination.update({
        where: { id: destinationId },
        data: { rating: avgRating },
      });

      return response('Review deleted successfully', 200, 'success', null);
    } catch (error: any) {
      throw error;
    }
  }
}
