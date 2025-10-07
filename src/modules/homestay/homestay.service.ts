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
import { CreateHomestayDto } from './dto/create-homestay.dto';
import { UpdateHomestayDto } from './dto/update-homestay.dto';
import { response } from '../../common/utils/response.utils';

@Injectable()
export class HomestayService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async createHomestay(
    ownerId: string,
    files: Express.Multer.File[],
    dto: CreateHomestayDto,
  ) {
    try {
      // Validate destination if provided
      if (dto.destinationId) {
        const destination = await this.prisma.destination.findUnique({
          where: { id: dto.destinationId },
        });
        if (!destination) {
          throw new NotFoundException('Destination not found');
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

      const homestay = await this.prisma.homestay.create({
        data: {
          name: dto.name,
          description: dto.description,
          address: dto.address,
          city: dto.city,
          country: dto.country,
          latitude: dto.latitude,
          longitude: dto.longitude,
          imageUrl: imageUrls,
          phoneNumber: dto.phoneNumber,
          email: dto.email,
          website: dto.website,
          pricePerNight: dto.pricePerNight,
          currency: dto.currency || 'VND',
          maxGuests: dto.maxGuests || 2,
          bedrooms: dto.bedrooms || 1,
          beds: dto.beds || 1,
          bathrooms: dto.bathrooms || 1,
          amenities: dto.amenities || [],
          houseRules: dto.houseRules || [],
          checkInTime: dto.checkInTime || '14:00',
          checkOutTime: dto.checkOutTime || '12:00',
          destinationId: dto.destinationId,
          isActive: dto.isActive ?? true,
          ownerId,
        },
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              name: true,
              profilePic: true,
            },
          },
          destination: {
            select: {
              id: true,
              title: true,
              location: true,
              city: true,
              country: true,
            },
          },
        },
      });

      return response('Tạo homestay thành công', 201, 'success', homestay);
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        error.message || 'Failed to create homestay',
      );
    }
  }

  async getAllHomestays(userId?: string) {
    const homestays = await this.prisma.homestay.findMany({
      where: {
        isActive: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePic: true,
          },
        },
        destination: {
          select: {
            id: true,
            title: true,
            location: true,
            city: true,
            country: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get like info if userId provided
    if (userId) {
      const homestayIds = homestays.map((h) => h.id);
      const userLikes = await this.prisma.like.findMany({
        where: {
          userId,
          targetId: { in: homestayIds },
          type: 'homestay',
        },
        select: { targetId: true },
      });
      const likedIds = new Set(userLikes.map((like) => like.targetId));

      const homestaysWithLikes = homestays.map((homestay) => ({
        ...homestay,
        isLiked: likedIds.has(homestay.id),
      }));

      return response(
        'Lấy danh sách homestay thành công',
        200,
        'success',
        homestaysWithLikes,
      );
    }

    return response(
      'Lấy danh sách homestay thành công',
      200,
      'success',
      homestays,
    );
  }

  async getMyHomestays(
    ownerId: string,
    status?: 'active' | 'inactive' | 'all',
  ) {
    try {
      const where: any = { ownerId };

      if (status === 'active') {
        where.isActive = true;
      } else if (status === 'inactive') {
        where.isActive = false;
      }
      // 'all' không cần filter isActive

      const homestays = await this.prisma.homestay.findMany({
        where,
        include: {
          destination: {
            select: {
              id: true,
              title: true,
              city: true,
            },
          },
          bookings: {
            where: {
              status: { in: ['pending', 'confirmed'] },
            },
            select: {
              id: true,
              status: true,
              checkInDate: true,
              checkOutDate: true,
            },
          },
          reviews: {
            select: {
              id: true,
              rating: true,
            },
            take: 5,
          },
          _count: {
            select: {
              bookings: true,
              reviews: true,
              likes: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Add statistics for each homestay
      const homestaysWithStats = homestays.map((homestay) => {
        const pendingBookings = homestay.bookings.filter(
          (b) => b.status === 'pending',
        ).length;
        const confirmedBookings = homestay.bookings.filter(
          (b) => b.status === 'confirmed',
        ).length;

        return {
          ...homestay,
          statistics: {
            totalBookings: homestay._count.bookings,
            pendingBookings,
            confirmedBookings,
            totalReviews: homestay._count.reviews,
            totalLikes: homestay._count.likes,
          },
        };
      });

      return response(
        'Lấy danh sách homestay của tôi thành công',
        200,
        'success',
        homestaysWithStats,
      );
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  async getHomestayById(id: string, userId: string) {
    const homestay = await this.prisma.homestay.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePic: true,
            email: true,
            phoneNumber: true,
          },
        },
        destination: {
          select: {
            id: true,
            title: true,
            location: true,
            city: true,
            country: true,
            imageUrl: true,
          },
        },
        reviews: {
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
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!homestay) {
      throw new NotFoundException('Không tìm thấy homestay');
    }

    // Track unique view with upsert (mỗi user chỉ tính 1 lần)
    await this.prisma.homestayView.upsert({
      where: {
        homestayId_userId: {
          homestayId: id,
          userId: userId,
        },
      },
      update: {
        viewedAt: new Date(), // Update thời gian xem gần nhất
      },
      create: {
        homestayId: id,
        userId: userId,
      },
    });

    // Sync viewCount từ unique views (chạy async, không chờ)
    this.prisma.homestay
      .update({
        where: { id },
        data: {
          viewCount: await this.prisma.homestayView.count({
            where: { homestayId: id },
          }),
        },
      })
      .catch(() => {
        // Silent fail - không ảnh hưởng response
      });

    // Check if user liked this homestay
    let isLiked = false;
    if (userId) {
      const like = await this.prisma.like.findFirst({
        where: {
          userId,
          targetId: id,
          type: 'homestay',
        },
      });
      isLiked = !!like;
    }

    return response('Lấy thông tin homestay thành công', 200, 'success', {
      ...homestay,
      isLiked,
    });
  }

  async getHomestaysByDestination(destinationId: string, userId?: string) {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
      select: { id: true, title: true },
    });

    if (!destination) {
      throw new NotFoundException('Không tìm thấy destination');
    }

    const homestays = await this.prisma.homestay.findMany({
      where: {
        destinationId,
        isActive: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePic: true,
          },
        },
      },
      orderBy: {
        rating: 'desc',
      },
    });

    if (userId) {
      const homestayIds = homestays.map((h) => h.id);
      const userLikes = await this.prisma.like.findMany({
        where: {
          userId,
          targetId: { in: homestayIds },
          type: 'homestay',
        },
        select: { targetId: true },
      });
      const likedIds = new Set(userLikes.map((like) => like.targetId));

      const homestaysWithLikes = homestays.map((homestay) => ({
        ...homestay,
        isLiked: likedIds.has(homestay.id),
      }));

      return response(
        `Lấy danh sách homestay tại ${destination.title} thành công`,
        200,
        'success',
        homestaysWithLikes,
      );
    }

    return response(
      `Lấy danh sách homestay tại ${destination.title} thành công`,
      200,
      'success',
      homestays,
    );
  }

  async updateHomestay(
    id: string,
    ownerId: string,
    files: Express.Multer.File[],
    dto: UpdateHomestayDto,
  ) {
    const homestay = await this.prisma.homestay.findUnique({
      where: { id },
    });

    if (!homestay) {
      throw new NotFoundException('Không tìm thấy homestay');
    }

    if (homestay.ownerId !== ownerId) {
      throw new BadRequestException('Bạn không có quyền cập nhật homestay này');
    }

    // Validate destination if provided
    if (dto.destinationId !== undefined) {
      if (dto.destinationId) {
        const destination = await this.prisma.destination.findUnique({
          where: { id: dto.destinationId },
        });
        if (!destination) {
          throw new NotFoundException('Destination not found');
        }
      }
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

    const updatedHomestay = await this.prisma.homestay.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.address && { address: dto.address }),
        ...(dto.city && { city: dto.city }),
        ...(dto.country && { country: dto.country }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(newImageUrls.length > 0 && {
          imageUrl: [...homestay.imageUrl, ...newImageUrls],
        }),
        ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.pricePerNight !== undefined && {
          pricePerNight: dto.pricePerNight,
        }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.maxGuests !== undefined && { maxGuests: dto.maxGuests }),
        ...(dto.bedrooms !== undefined && { bedrooms: dto.bedrooms }),
        ...(dto.beds !== undefined && { beds: dto.beds }),
        ...(dto.bathrooms !== undefined && { bathrooms: dto.bathrooms }),
        ...(dto.amenities !== undefined && { amenities: dto.amenities }),
        ...(dto.houseRules !== undefined && { houseRules: dto.houseRules }),
        ...(dto.checkInTime !== undefined && { checkInTime: dto.checkInTime }),
        ...(dto.checkOutTime !== undefined && {
          checkOutTime: dto.checkOutTime,
        }),
        ...(dto.destinationId !== undefined && {
          destinationId: dto.destinationId,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePic: true,
          },
        },
        destination: {
          select: {
            id: true,
            title: true,
            location: true,
            city: true,
            country: true,
          },
        },
      },
    });

    return response(
      'Cập nhật homestay thành công',
      200,
      'success',
      updatedHomestay,
    );
  }

  async deleteHomestay(id: string, ownerId: string) {
    const homestay = await this.prisma.homestay.findUnique({
      where: { id },
    });

    if (!homestay) {
      throw new NotFoundException('Không tìm thấy homestay');
    }

    if (homestay.ownerId !== ownerId) {
      throw new BadRequestException('Bạn không có quyền xóa homestay này');
    }

    // Delete images from cloudinary
    for (const imageUrl of homestay.imageUrl) {
      try {
        const publicId = this.cloudinary.extractPublicId(imageUrl);
        await this.cloudinary.deleteImage(publicId);
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    }

    await this.prisma.homestay.delete({
      where: { id },
    });

    return response('Xóa homestay thành công', 200, 'success');
  }

  async searchHomestays(
    query?: string,
    city?: string,
    minPrice?: number,
    maxPrice?: number,
    minRating?: number,
    maxGuests?: number,
    bedrooms?: number,
    amenities?: string[],
    sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'popular',
    userId?: string,
  ) {
    const where: any = {
      isActive: true,
    };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.pricePerNight = {};
      if (minPrice !== undefined) where.pricePerNight.gte = minPrice;
      if (maxPrice !== undefined) where.pricePerNight.lte = maxPrice;
    }

    if (minRating !== undefined) {
      where.rating = { gte: minRating };
    }

    if (maxGuests !== undefined) {
      where.maxGuests = { gte: maxGuests };
    }

    if (bedrooms !== undefined) {
      where.bedrooms = { gte: bedrooms };
    }

    if (amenities && amenities.length > 0) {
      where.amenities = {
        hasSome: amenities,
      };
    }

    // Sorting logic
    let orderBy: any = { rating: 'desc' };
    if (sortBy === 'price_asc') {
      orderBy = { pricePerNight: 'asc' };
    } else if (sortBy === 'price_desc') {
      orderBy = { pricePerNight: 'desc' };
    } else if (sortBy === 'rating') {
      orderBy = { rating: 'desc' };
    } else if (sortBy === 'popular') {
      orderBy = [
        { viewCount: 'desc' },
        { likeCount: 'desc' },
        { reviewCount: 'desc' },
      ];
    }

    const homestays = await this.prisma.homestay.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePic: true,
          },
        },
        destination: {
          select: {
            id: true,
            title: true,
            location: true,
            city: true,
            country: true,
          },
        },
      },
      orderBy,
    });

    // Add isLiked field if userId is provided
    let homestaysWithLikes = homestays;
    if (userId) {
      const homestayIds = homestays.map((h) => h.id);
      const userLikes = await this.prisma.like.findMany({
        where: {
          userId,
          targetId: { in: homestayIds },
          type: 'homestay',
        },
      });

      const likedHomestayIds = new Set(userLikes.map((like) => like.targetId));
      homestaysWithLikes = homestays.map((homestay) => ({
        ...homestay,
        isLiked: likedHomestayIds.has(homestay.id),
      }));
    }

    return response(
      'Tìm kiếm homestay thành công',
      200,
      'success',
      homestaysWithLikes,
    );
  }

  async getPopularHomestays(limit: number = 10, userId?: string) {
    try {
      const homestays = await this.prisma.homestay.findMany({
        where: { isActive: true },
        include: {
          destination: {
            select: {
              id: true,
              title: true,
              location: true,
              city: true,
            },
          },
          owner: {
            select: {
              id: true,
              username: true,
              name: true,
              profilePic: true,
            },
          },
          reviews: {
            select: {
              id: true,
              rating: true,
            },
            take: 5,
          },
        },
        orderBy: [
          { viewCount: 'desc' },
          { likeCount: 'desc' },
          { reviewCount: 'desc' },
          { rating: 'desc' },
        ],
        take: limit,
      });

      // Add isLiked field
      let homestaysWithLikes = homestays;
      if (userId) {
        const homestayIds = homestays.map((h) => h.id);
        const userLikes = await this.prisma.like.findMany({
          where: {
            userId,
            targetId: { in: homestayIds },
            type: 'homestay',
          },
        });

        const likedHomestayIds = new Set(
          userLikes.map((like) => like.targetId),
        );
        homestaysWithLikes = homestays.map((homestay) => ({
          ...homestay,
          isLiked: likedHomestayIds.has(homestay.id),
        }));
      }

      return response(
        'Lấy danh sách homestay phổ biến thành công',
        200,
        'success',
        homestaysWithLikes,
      );
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  async getPopularHomestaysByDestination(
    destinationId: string,
    limit: number = 10,
    userId?: string,
  ) {
    try {
      const destination = await this.prisma.destination.findUnique({
        where: { id: destinationId },
      });

      if (!destination) {
        throw new NotFoundException('Không tìm thấy địa điểm');
      }

      const homestays = await this.prisma.homestay.findMany({
        where: {
          destinationId,
          isActive: true,
        },
        include: {
          destination: {
            select: {
              id: true,
              title: true,
              location: true,
              city: true,
            },
          },
          owner: {
            select: {
              id: true,
              username: true,
              name: true,
              profilePic: true,
            },
          },
          reviews: {
            select: {
              id: true,
              rating: true,
              comment: true,
            },
            take: 3,
          },
        },
        orderBy: [
          { viewCount: 'desc' },
          { likeCount: 'desc' },
          { reviewCount: 'desc' },
          { rating: 'desc' },
        ],
        take: limit,
      });

      // Add isLiked field
      let homestaysWithLikes = homestays;
      if (userId) {
        const homestayIds = homestays.map((h) => h.id);
        const userLikes = await this.prisma.like.findMany({
          where: {
            userId,
            targetId: { in: homestayIds },
            type: 'homestay',
          },
        });

        const likedHomestayIds = new Set(
          userLikes.map((like) => like.targetId),
        );
        homestaysWithLikes = homestays.map((homestay) => ({
          ...homestay,
          isLiked: likedHomestayIds.has(homestay.id),
        }));
      }

      return response(
        `Lấy danh sách homestay phổ biến tại ${destination.title} thành công`,
        200,
        'success',
        homestaysWithLikes,
      );
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
