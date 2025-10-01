/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
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
    dto: CreateDestinationDto,
    images?: Express.Multer.File[],
  ) {
    try {
      // Upload images if provided
      let uploadedImages: any[] = [];

      // Handle file uploads
      if (images && images.length > 0) {
        const uploadPromises = images.map(async (image, index) => {
          const result = await this.cloudinary.uploadImage(image);
          return {
            url: result.secure_url,
            isMain: index === 0,
            order: index,
          };
        });
        uploadedImages = await Promise.all(uploadPromises);
      }

      // Handle URL strings from DTO (fallback)
      if (
        (!images || images.length === 0) &&
        dto.images &&
        dto.images.length > 0
      ) {
        uploadedImages = dto.images.map((imageUrl, index) => ({
          url: imageUrl,
          isMain: index === 0,
          order: index,
        }));
      }

      const destination = await this.prisma.destination.create({
        data: {
          name: dto.name,
          description: dto.description,
          shortDesc: dto.shortDesc,
          address: dto.address,
          city: dto.city,
          country: dto.country,
          latitude: dto.latitude,
          longitude: dto.longitude,
          category: dto.category as any,
          priceRange: dto.priceRange as any,
          website: dto.website,
          phone: dto.phone,
          email: dto.email,
          openingHours: dto.openingHours,
          tags: dto.tags,
          amenities: dto.amenities,
          createdById: userId,
          images: {
            create: uploadedImages,
          },
        },
        include: {
          images: true,
          createdBy: {
            select: {
              id: true,
              username: true,
              name: true,
              profilePic: true,
            },
          },
          _count: {
            select: {
              reviews: true,
              favorites: true,
              checkins: true,
            },
          },
        },
      });

      return response('Tạo địa điểm thành công', 201, 'success', destination);
    } catch {
      throw new BadRequestException('Không thể tạo địa điểm');
    }
  }

  async getDestinations(query: SearchDestinationDto) {
    const {
      search,
      city,
      country,
      category,
      priceRange,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      isPublic: true,
      status: 'ACTIVE',
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (country) {
      where.country = { contains: country, mode: 'insensitive' };
    }

    if (category) {
      where.category = category;
    }

    if (priceRange) {
      where.priceRange = priceRange;
    }

    const [destinations, total] = await Promise.all([
      this.prisma.destination.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          images: {
            orderBy: { order: 'asc' },
            take: 3,
          },
          createdBy: {
            select: {
              id: true,
              username: true,
              name: true,
              profilePic: true,
            },
          },
          _count: {
            select: {
              reviews: true,
              favorites: true,
              checkins: true,
            },
          },
        },
      }),
      this.prisma.destination.count({ where }),
    ]);

    return response('Lấy danh sách địa điểm thành công', 200, 'success', {
      destinations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  async getDestinationById(id: string, userId?: string) {
    const destination = await this.prisma.destination.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePic: true,
          },
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
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
        },
        _count: {
          select: {
            reviews: true,
            favorites: true,
            checkins: true,
          },
        },
      },
    });

    if (!destination) {
      throw new NotFoundException('Không tìm thấy địa điểm');
    }

    // Check if user has favorited this destination
    let isFavorite = false;
    if (userId) {
      const favorite = await this.prisma.destinationFavorite.findUnique({
        where: {
          userId_destinationId: {
            userId,
            destinationId: id,
          },
        },
      });
      isFavorite = !!favorite;
    }

    // Increment visit count
    await this.prisma.destination.update({
      where: { id },
      data: { visitCount: { increment: 1 } },
    });

    return response('Lấy thông tin địa điểm thành công', 200, 'success', {
      ...destination,
      isFavorite,
    });
  }

  async updateDestination(
    id: string,
    userId: string,
    dto: UpdateDestinationDto,
  ) {
    const destination = await this.prisma.destination.findUnique({
      where: { id },
    });

    if (!destination) {
      throw new NotFoundException('Không tìm thấy địa điểm');
    }

    if (destination.createdById !== userId) {
      throw new BadRequestException('Bạn không có quyền cập nhật địa điểm này');
    }

    const updatedDestination = await this.prisma.destination.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description && { description: dto.description }),
        ...(dto.shortDesc && { shortDesc: dto.shortDesc }),
        ...(dto.address && { address: dto.address }),
        ...(dto.city && { city: dto.city }),
        ...(dto.country && { country: dto.country }),
        ...(dto.latitude && { latitude: dto.latitude }),
        ...(dto.longitude && { longitude: dto.longitude }),
        ...(dto.category && { category: dto.category as any }),
        ...(dto.priceRange && { priceRange: dto.priceRange as any }),
        ...(dto.website && { website: dto.website }),
        ...(dto.phone && { phone: dto.phone }),
        ...(dto.email && { email: dto.email }),
        ...(dto.openingHours && { openingHours: dto.openingHours }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.amenities && { amenities: dto.amenities }),
      },
      include: {
        images: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePic: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            favorites: true,
            checkins: true,
          },
        },
      },
    });

    return response(
      'Cập nhật địa điểm thành công',
      200,
      'success',
      updatedDestination,
    );
  }

  async deleteDestination(id: string, userId: string) {
    const destination = await this.prisma.destination.findUnique({
      where: { id },
    });

    if (!destination) {
      throw new NotFoundException('Không tìm thấy địa điểm');
    }

    if (destination.createdById !== userId) {
      throw new BadRequestException('Bạn không có quyền xóa địa điểm này');
    }

    await this.prisma.destination.delete({
      where: { id },
    });

    return response('Xóa địa điểm thành công', 200, 'success', null);
  }

  async toggleFavorite(destinationId: string, userId: string) {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!destination) {
      throw new NotFoundException('Không tìm thấy địa điểm');
    }

    const existingFavorite = await this.prisma.destinationFavorite.findUnique({
      where: {
        userId_destinationId: {
          userId,
          destinationId,
        },
      },
    });

    if (existingFavorite) {
      await this.prisma.destinationFavorite.delete({
        where: { id: existingFavorite.id },
      });
      return response('Đã bỏ yêu thích địa điểm', 200, 'success', {
        isFavorite: false,
      });
    } else {
      await this.prisma.destinationFavorite.create({
        data: {
          userId,
          destinationId,
        },
      });
      return response('Đã thêm vào yêu thích', 200, 'success', {
        isFavorite: true,
      });
    }
  }

  async checkinDestination(destinationId: string, userId: string) {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!destination) {
      throw new NotFoundException('Không tìm thấy địa điểm');
    }

    const checkin = await this.prisma.destinationCheckin.create({
      data: {
        destinationId,
        userId,
        // note, // Removed as not part of schema
      },
      include: {
        destination: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
          },
        },
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

    return response('Check-in thành công', 200, 'success', checkin);
  }

  async getPopularDestinations(limit: number = 10) {
    const destinations = await this.prisma.destination.findMany({
      where: {
        isPublic: true,
        status: 'ACTIVE',
      },
      orderBy: [
        { visitCount: 'desc' },
        { rating: 'desc' },
        { reviewCount: 'desc' },
      ],
      take: limit,
      include: {
        images: {
          orderBy: { order: 'asc' },
          take: 1,
        },
        _count: {
          select: {
            reviews: true,
            favorites: true,
            checkins: true,
          },
        },
      },
    });

    return response(
      'Lấy danh sách địa điểm phổ biến thành công',
      200,
      'success',
      destinations,
    );
  }

  async getNearbyDestinations(
    latitude: number,
    longitude: number,
    radius: number = 50, // km
    limit: number = 10,
  ) {
    // Simple distance calculation - for production, consider using PostGIS or similar
    const destinations = await this.prisma.destination.findMany({
      where: {
        isPublic: true,
        status: 'ACTIVE',
        latitude: { not: null },
        longitude: { not: null },
      },
      include: {
        images: {
          orderBy: { order: 'asc' },
          take: 1,
        },
        _count: {
          select: {
            reviews: true,
            favorites: true,
            checkins: true,
          },
        },
      },
    });

    // Calculate distance and filter
    const nearbyDestinations = destinations
      .map((destination) => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          destination.latitude || 0,
          destination.longitude || 0,
        );
        return { ...destination, distance };
      })
      .filter((destination) => destination.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return response(
      'Lấy danh sách địa điểm gần đây thành công',
      200,
      'success',
      nearbyDestinations,
    );
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async uploadImages(
    id: string,
    images: Express.Multer.File[],
    userId: string,
  ) {
    const destination = await this.prisma.destination.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!destination) {
      throw new NotFoundException('Không tìm thấy địa điểm');
    }

    // Kiểm tra quyền (chỉ người tạo mới được upload)
    if (destination.createdById !== userId) {
      throw new BadRequestException(
        'Bạn không có quyền upload ảnh cho địa điểm này',
      );
    }

    if (!images || images.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một ảnh');
    }

    // Upload ảnh lên Cloudinary
    const uploadPromises = images.map(async (image, index) => {
      const result = await this.cloudinary.uploadImage(image);
      return {
        destinationId: id,
        url: result.secure_url,
        uploadedById: userId,
        isMain: destination.images.length === 0 && index === 0, // Ảnh đầu tiên làm main nếu chưa có ảnh
        order: destination.images.length + index,
      };
    });

    const uploadedImageData = await Promise.all(uploadPromises);

    // Tạo records trong database
    const createdImages = await Promise.all(
      uploadedImageData.map((data) =>
        this.prisma.destinationImage.create({ data }),
      ),
    );

    // Cập nhật coverImage nếu chưa có
    if (!destination.coverImage && createdImages.length > 0) {
      await this.prisma.destination.update({
        where: { id },
        data: { coverImage: createdImages[0].url },
      });
    }

    return response('Upload ảnh thành công', 200, 'success', {
      uploadedImages: createdImages,
      totalImages: destination.images.length + createdImages.length,
    });
  }

  async updateImages(
    id: string,
    imageUrls: string[],
    coverImage?: string,
    userId?: string,
  ) {
    const destination = await this.prisma.destination.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!destination) {
      throw new NotFoundException('Không tìm thấy địa điểm');
    }

    // Kiểm tra quyền
    if (userId && destination.createdById !== userId) {
      throw new BadRequestException(
        'Bạn không có quyền cập nhật ảnh cho địa điểm này',
      );
    }

    // Validate coverImage phải nằm trong danh sách images
    if (coverImage && !imageUrls.includes(coverImage)) {
      throw new BadRequestException('Ảnh cover phải nằm trong danh sách ảnh');
    }

    // Xóa các ảnh không còn trong danh sách
    const currentImageUrls = destination.images.map((img) => img.url);
    const imagesToDelete = currentImageUrls.filter(
      (url) => !imageUrls.includes(url),
    );

    if (imagesToDelete.length > 0) {
      await this.prisma.destinationImage.deleteMany({
        where: {
          destinationId: id,
          url: { in: imagesToDelete },
        },
      });

      // Xóa từ Cloudinary
      for (const imageUrl of imagesToDelete) {
        try {
          await this.cloudinary.deleteImage(imageUrl);
        } catch (error) {
          console.error('Không thể xóa ảnh từ Cloudinary:', error);
        }
      }
    }

    // Thêm các ảnh mới
    const imagesToAdd = imageUrls.filter(
      (url) => !currentImageUrls.includes(url),
    );
    if (imagesToAdd.length > 0) {
      const newImageData = imagesToAdd.map((url, index) => ({
        destinationId: id,
        url,
        uploadedById: userId || destination.createdById,
        isMain: false,
        order: destination.images.length + index,
      }));

      await Promise.all(
        newImageData.map((data) =>
          this.prisma.destinationImage.create({ data }),
        ),
      );
    }

    // Cập nhật coverImage
    const updatedDestination = await this.prisma.destination.update({
      where: { id },
      data: {
        coverImage: coverImage || destination.coverImage,
      },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return response(
      'Cập nhật ảnh thành công',
      200,
      'success',
      updatedDestination,
    );
  }

  async deleteImage(id: string, imageUrl: string, userId: string) {
    const destination = await this.prisma.destination.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!destination) {
      throw new NotFoundException('Không tìm thấy địa điểm');
    }

    // Kiểm tra quyền
    if (destination.createdById !== userId) {
      throw new BadRequestException(
        'Bạn không có quyền xóa ảnh cho địa điểm này',
      );
    }

    const imageToDelete = destination.images.find(
      (img) => img.url === imageUrl,
    );
    if (!imageToDelete) {
      throw new NotFoundException('Không tìm thấy ảnh trong danh sách');
    }

    // Xóa ảnh từ database
    await this.prisma.destinationImage.delete({
      where: { id: imageToDelete.id },
    });

    // Nếu ảnh bị xóa là cover image, set cover image mới
    let newCoverImage = destination.coverImage;
    if (destination.coverImage === imageUrl) {
      const remainingImages = destination.images.filter(
        (img) => img.url !== imageUrl,
      );
      newCoverImage =
        remainingImages.length > 0 ? remainingImages[0].url : null;

      await this.prisma.destination.update({
        where: { id },
        data: { coverImage: newCoverImage },
      });
    }

    // Xóa ảnh từ Cloudinary
    try {
      await this.cloudinary.deleteImage(imageUrl);
    } catch (error) {
      console.error('Không thể xóa ảnh từ Cloudinary:', error);
    }

    return response('Xóa ảnh thành công', 200, 'success', {
      deletedImage: imageUrl,
      newCoverImage: newCoverImage,
      remainingImages: destination.images.filter((img) => img.url !== imageUrl)
        .length,
    });
  }
}
