/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateHomestayDto } from './dto/create-homestay.dto';
import { UpdateHomestayDto } from './dto/update-homestay.dto';
import { SearchHomestayDto } from './dto/search-homestay.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateHomestayReviewDto } from './dto/create-homestay-review.dto';
import { response } from '../../common/utils/response.utils';

@Injectable()
export class HomestayService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async createHomestay(userId: string, dto: CreateHomestayDto) {
    try {
      // Upload images if provided
      let uploadedImages: { url: string; isMain: boolean; order: number }[] =
        [];
      if (dto.images && dto.images.length > 0) {
        uploadedImages = await Promise.all(
          dto.images.map((imageUrl, index) => ({
            url: imageUrl, // Assuming these are already uploaded URLs
            isMain: index === 0,
            order: index,
          })),
        );
      }

      const homestay = await this.prisma.homestay.create({
        data: {
          title: dto.title,
          description: dto.description,
          shortDesc: dto.shortDesc,
          address: dto.address,
          city: dto.city,
          country: dto.country,
          latitude: dto.latitude,
          longitude: dto.longitude,
          type: dto.type as any,
          pricePerNight: dto.pricePerNight,
          currency: dto.currency,
          maxGuests: dto.maxGuests,
          bedrooms: dto.bedrooms,
          bathrooms: dto.bathrooms,
          beds: dto.beds || 1,
          checkInTime: dto.checkInTime,
          checkOutTime: dto.checkOutTime,
          minStay: dto.minStay,
          maxStay: dto.maxStay,
          amenities: dto.amenities,
          houseRules: dto.houseRules,
          cancellationPolicy: dto.cancellationPolicy,
          instantBook: dto.instantBook,
          phone: dto.phone,
          email: dto.email,
          hostId: userId,
          images: {
            create: uploadedImages,
          },
        },
        include: {
          images: true,
          host: {
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
              bookings: true,
            },
          },
        },
      });

      return response('Tạo homestay thành công', 201, 'success', homestay);
    } catch (error) {
      throw new BadRequestException('Không thể tạo homestay');
    }
  }

  async getHomestays(query: SearchHomestayDto) {
    const {
      search,
      city,
      country,
      type,
      minPrice,
      maxPrice,
      guests,
      bedrooms,
      bathrooms,
      checkIn,
      checkOut,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
      status: 'ACTIVE',
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
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

    if (type) {
      where.type = type;
    }

    if (minPrice) {
      where.pricePerNight = { ...where.pricePerNight, gte: minPrice };
    }

    if (maxPrice) {
      where.pricePerNight = { ...where.pricePerNight, lte: maxPrice };
    }

    if (guests) {
      where.maxGuests = { gte: guests };
    }

    if (bedrooms) {
      where.bedrooms = { gte: bedrooms };
    }

    if (bathrooms) {
      where.bathrooms = { gte: bathrooms };
    }

    // Check availability if dates provided
    if (checkIn && checkOut) {
      where.bookings = {
        none: {
          AND: [
            { status: { in: ['CONFIRMED', 'PENDING'] } },
            {
              OR: [
                {
                  AND: [
                    { checkInDate: { lte: new Date(checkIn) } },
                    { checkOutDate: { gt: new Date(checkIn) } },
                  ],
                },
                {
                  AND: [
                    { checkInDate: { lt: new Date(checkOut) } },
                    { checkOutDate: { gte: new Date(checkOut) } },
                  ],
                },
                {
                  AND: [
                    { checkInDate: { gte: new Date(checkIn) } },
                    { checkOutDate: { lte: new Date(checkOut) } },
                  ],
                },
              ],
            },
          ],
        },
      };
    }

    const [homestays, total] = await Promise.all([
      this.prisma.homestay.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          images: {
            orderBy: { order: 'asc' },
            take: 3,
          },
          host: {
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
              bookings: true,
            },
          },
        },
      }),
      this.prisma.homestay.count({ where }),
    ]);

    return response('Lấy danh sách homestay thành công', 200, 'success', {
      homestays,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  async getHomestayById(id: string, userId?: string) {
    const homestay = await this.prisma.homestay.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        host: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePic: true,
            createdAt: true,
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
            bookings: true,
          },
        },
      },
    });

    if (!homestay) {
      throw new NotFoundException('Không tìm thấy homestay');
    }

    // Check if user has favorited this homestay
    let isFavorite = false;
    if (userId) {
      const favorite = await this.prisma.homestayFavorite.findUnique({
        where: {
          userId_homestayId: {
            userId,
            homestayId: id,
          },
        },
      });
      isFavorite = !!favorite;
    }

    return response('Lấy thông tin homestay thành công', 200, 'success', {
      ...homestay,
      isFavorite,
    });
  }

  async updateHomestay(id: string, userId: string, dto: UpdateHomestayDto) {
    const homestay = await this.prisma.homestay.findUnique({
      where: { id },
    });

    if (!homestay) {
      throw new NotFoundException('Không tìm thấy homestay');
    }

    if (homestay.hostId !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật homestay này');
    }

    const updatedHomestay = await this.prisma.homestay.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.shortDesc && { shortDesc: dto.shortDesc }),
        ...(dto.address && { address: dto.address }),
        ...(dto.city && { city: dto.city }),
        ...(dto.country && { country: dto.country }),
        ...(dto.latitude && { latitude: dto.latitude }),
        ...(dto.longitude && { longitude: dto.longitude }),
        ...(dto.type && { type: dto.type as any }),
        ...(dto.pricePerNight && { pricePerNight: dto.pricePerNight }),
        ...(dto.maxGuests && { maxGuests: dto.maxGuests }),
        ...(dto.bedrooms && { bedrooms: dto.bedrooms }),
        ...(dto.bathrooms && { bathrooms: dto.bathrooms }),
        ...(dto.beds && { beds: dto.beds }),
        ...(dto.amenities && { amenities: dto.amenities }),
        ...(dto.houseRules && { houseRules: dto.houseRules }),
        ...(dto.checkInTime && { checkInTime: dto.checkInTime }),
        ...(dto.checkOutTime && { checkOutTime: dto.checkOutTime }),
        ...(dto.minStay && { minStay: dto.minStay }),
        ...(dto.maxStay && { maxStay: dto.maxStay }),
      },
      include: {
        images: true,
        host: {
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
            bookings: true,
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

  async deleteHomestay(id: string, userId: string) {
    const homestay = await this.prisma.homestay.findUnique({
      where: { id },
    });

    if (!homestay) {
      throw new NotFoundException('Không tìm thấy homestay');
    }

    if (homestay.hostId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa homestay này');
    }

    await this.prisma.homestay.delete({
      where: { id },
    });

    return response('Xóa homestay thành công', 200, 'success', null);
  }

  async toggleFavorite(homestayId: string, userId: string) {
    const homestay = await this.prisma.homestay.findUnique({
      where: { id: homestayId },
    });

    if (!homestay) {
      throw new NotFoundException('Không tìm thấy homestay');
    }

    const existingFavorite = await this.prisma.homestayFavorite.findUnique({
      where: {
        userId_homestayId: {
          userId,
          homestayId,
        },
      },
    });

    if (existingFavorite) {
      await this.prisma.homestayFavorite.delete({
        where: { id: existingFavorite.id },
      });
      return response('Đã bỏ yêu thích homestay', 200, 'success', {
        isFavorite: false,
      });
    } else {
      await this.prisma.homestayFavorite.create({
        data: {
          userId,
          homestayId,
        },
      });
      return response('Đã thêm vào yêu thích', 200, 'success', {
        isFavorite: true,
      });
    }
  }

  async createBooking(userId: string, dto: CreateBookingDto) {
    const homestay = await this.prisma.homestay.findUnique({
      where: { id: dto.homestayId },
    });

    if (!homestay) {
      throw new NotFoundException('Không tìm thấy homestay');
    }

    if (!homestay.isActive) {
      throw new BadRequestException('Homestay không khả dụng');
    }

    // Check availability
    const checkInDate = new Date(dto.checkInDate);
    const checkOutDate = new Date(dto.checkOutDate);
    const totalNights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (totalNights <= 0) {
      throw new BadRequestException('Ngày check-out phải sau ngày check-in');
    }

    if (homestay.minStay && totalNights < homestay.minStay) {
      throw new BadRequestException(`Số đêm tối thiểu là ${homestay.minStay}`);
    }

    if (homestay.maxStay && totalNights > homestay.maxStay) {
      throw new BadRequestException(`Số đêm tối đa là ${homestay.maxStay}`);
    }

    if (dto.guests > homestay.maxGuests) {
      throw new BadRequestException(`Số khách tối đa là ${homestay.maxGuests}`);
    }

    // Check for conflicting bookings
    const conflictingBooking = await this.prisma.homestayBooking.findFirst({
      where: {
        homestayId: dto.homestayId,
        status: { in: ['CONFIRMED', 'PENDING'] },
        OR: [
          {
            AND: [
              { checkInDate: { lte: checkInDate } },
              { checkOutDate: { gt: checkInDate } },
            ],
          },
          {
            AND: [
              { checkInDate: { lt: checkOutDate } },
              { checkOutDate: { gte: checkOutDate } },
            ],
          },
          {
            AND: [
              { checkInDate: { gte: checkInDate } },
              { checkOutDate: { lte: checkOutDate } },
            ],
          },
        ],
      },
    });

    if (conflictingBooking) {
      throw new BadRequestException(
        'Homestay đã được đặt trong khoảng thời gian này',
      );
    }

    const totalPrice = homestay.pricePerNight * totalNights;

    const booking = await this.prisma.homestayBooking.create({
      data: {
        homestayId: dto.homestayId,
        guestId: userId,
        checkInDate,
        checkOutDate,
        guests: dto.guests,
        totalNights,
        pricePerNight: homestay.pricePerNight,
        totalPrice,
        currency: homestay.currency,
        guestName: dto.guestName || '',
        guestPhone: dto.guestPhone || '',
        guestEmail: dto.guestEmail || '',
        specialRequests: dto.specialRequests,
        paymentMethod: dto.paymentMethod,
      },
      include: {
        homestay: {
          select: {
            id: true,
            title: true,
            city: true,
            country: true,
            images: {
              take: 1,
              orderBy: { order: 'asc' },
            },
          },
        },
        guest: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePic: true,
          },
        },
      },
    });

    return response('Đặt phòng thành công', 201, 'success', booking);
  }

  async getUserBookings(userId: string, status?: string) {
    const where: any = { guestId: userId };

    if (status) {
      where.status = status;
    }

    const bookings = await this.prisma.homestayBooking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        homestay: {
          select: {
            id: true,
            title: true,
            city: true,
            country: true,
            images: {
              take: 1,
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    return response(
      'Lấy danh sách đặt phòng thành công',
      200,
      'success',
      bookings,
    );
  }

  async getHostBookings(hostId: string, status?: string) {
    const where: any = {
      homestay: {
        hostId,
      },
    };

    if (status) {
      where.status = status;
    }

    const bookings = await this.prisma.homestayBooking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        homestay: {
          select: {
            id: true,
            title: true,
            city: true,
            country: true,
          },
        },
        guest: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePic: true,
          },
        },
      },
    });

    return response(
      'Lấy danh sách đặt phòng thành công',
      200,
      'success',
      bookings,
    );
  }

  async updateBookingStatus(bookingId: string, hostId: string, status: string) {
    const booking = await this.prisma.homestayBooking.findUnique({
      where: { id: bookingId },
      include: {
        homestay: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy booking');
    }

    if (booking.homestay.hostId !== hostId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật booking này');
    }

    const updatedBooking = await this.prisma.homestayBooking.update({
      where: { id: bookingId },
      data: { status: status as any },
      include: {
        homestay: {
          select: {
            id: true,
            title: true,
            city: true,
            country: true,
          },
        },
        guest: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePic: true,
          },
        },
      },
    });

    return response(
      'Cập nhật trạng thái booking thành công',
      200,
      'success',
      updatedBooking,
    );
  }

  async createReview(userId: string, dto: CreateHomestayReviewDto) {
    const homestay = await this.prisma.homestay.findUnique({
      where: { id: dto.homestayId },
    });

    if (!homestay) {
      throw new NotFoundException('Không tìm thấy homestay');
    }

    // Check if user has a completed booking for this homestay
    const completedBooking = await this.prisma.homestayBooking.findFirst({
      where: {
        homestayId: dto.homestayId,
        guestId: userId,
        status: 'COMPLETED',
      },
    });

    if (!completedBooking) {
      throw new BadRequestException(
        'Bạn chỉ có thể đánh giá sau khi hoàn thành đặt phòng',
      );
    }

    // Check if user already reviewed this homestay
    const existingReview = await this.prisma.homestayReview.findFirst({
      where: {
        homestayId: dto.homestayId,
        userId,
      },
    });

    if (existingReview) {
      throw new BadRequestException('Bạn đã đánh giá homestay này rồi');
    }

    const review = await this.prisma.homestayReview.create({
      data: {
        homestayId: dto.homestayId,
        userId,
        bookingId: dto.bookingId,
        overallRating: dto.overallRating,
        cleanRating: dto.cleanRating,
        locationRating: dto.locationRating,
        serviceRating: dto.serviceRating,
        valueRating: dto.valueRating,
        amenityRating: dto.amenityRating,
        comment: dto.comment,
        title: dto.title,
        tripType: dto.tripType,
        stayPeriod: dto.stayPeriod,
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
        homestay: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Update homestay rating
    await this.updateHomestayRating(dto.homestayId);

    return response('Tạo đánh giá thành công', 201, 'success', review);
  }

  private async updateHomestayRating(homestayId: string) {
    const reviews = await this.prisma.homestayReview.findMany({
      where: { homestayId },
    });

    if (reviews.length > 0) {
      const avgRating =
        reviews.reduce((sum, review) => sum + review.overallRating, 0) /
        reviews.length;

      await this.prisma.homestay.update({
        where: { id: homestayId },
        data: {
          rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
          reviewCount: reviews.length,
        },
      });
    }
  }

  async getPopularHomestays(limit: number = 10) {
    const homestays = await this.prisma.homestay.findMany({
      where: {
        isActive: true,
        status: 'ACTIVE',
      },
      orderBy: [
        { rating: 'desc' },
        { reviewCount: 'desc' },
        { createdAt: 'desc' },
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
            bookings: true,
          },
        },
      },
    });

    return response(
      'Lấy danh sách homestay phổ biến thành công',
      200,
      'success',
      homestays,
    );
  }

  async getNearbyHomestays(
    latitude: number,
    longitude: number,
    radius: number = 50, // km
    limit: number = 10,
  ) {
    const homestays = await this.prisma.homestay.findMany({
      where: {
        isActive: true,
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
            bookings: true,
          },
        },
      },
    });

    // Calculate distance and filter
    const nearbyHomestays = homestays
      .map((homestay) => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          homestay.latitude || 0,
          homestay.longitude || 0,
        );
        return { ...homestay, distance };
      })
      .filter((homestay) => homestay.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return response(
      'Lấy danh sách homestay gần đây thành công',
      200,
      'success',
      nearbyHomestays,
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
}
