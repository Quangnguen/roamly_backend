import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { response } from '../../common/utils/response.utils';
import { SocketGateway } from '../socket/socket.gateway';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly socketGateway: SocketGateway,
    private readonly notificationService: NotificationService,
  ) {}

  async createBooking(guestId: string, dto: CreateBookingDto) {
    try {
      // Validate homestay exists and is active
      const homestay = await this.prisma.homestay.findUnique({
        where: { id: dto.homestayId },
      });

      if (!homestay) {
        throw new NotFoundException('Không tìm thấy homestay');
      }

      if (!homestay.isActive) {
        throw new BadRequestException('Homestay này hiện không hoạt động');
      }

      // Validate dates
      const checkIn = new Date(dto.checkInDate);
      const checkOut = new Date(dto.checkOutDate);
      const now = new Date();

      if (checkIn < now) {
        throw new BadRequestException('Ngày check-in phải từ hôm nay trở đi');
      }

      if (checkOut <= checkIn) {
        throw new BadRequestException('Ngày check-out phải sau ngày check-in');
      }

      // Validate number of guests
      const numberOfGuests = dto.numberOfGuests || 1;
      if (numberOfGuests > homestay.maxGuests) {
        throw new BadRequestException(
          `Số lượng khách vượt quá giới hạn (tối đa ${homestay.maxGuests} khách)`,
        );
      }

      // Check availability (no overlapping confirmed bookings)
      const overlappingBookings = await this.prisma.booking.findMany({
        where: {
          homestayId: dto.homestayId,
          status: { in: ['pending', 'confirmed'] },
          OR: [
            {
              AND: [
                { checkInDate: { lte: checkIn } },
                { checkOutDate: { gt: checkIn } },
              ],
            },
            {
              AND: [
                { checkInDate: { lt: checkOut } },
                { checkOutDate: { gte: checkOut } },
              ],
            },
            {
              AND: [
                { checkInDate: { gte: checkIn } },
                { checkOutDate: { lte: checkOut } },
              ],
            },
          ],
        },
      });

      if (overlappingBookings.length > 0) {
        throw new BadRequestException(
          'Homestay đã được đặt trong khoảng thời gian này',
        );
      }

      // Calculate total price
      const numberOfNights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
      );
      const totalPrice = numberOfNights * homestay.pricePerNight;

      // Create booking
      const booking = await this.prisma.booking.create({
        data: {
          homestayId: dto.homestayId,
          guestId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfGuests,
          totalPrice,
          specialRequests: dto.specialRequests,
          status: 'pending',
        },
        include: {
          homestay: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              imageUrl: true,
              pricePerNight: true,
              currency: true,
              ownerId: true,
              owner: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  email: true,
                  phoneNumber: true,
                },
              },
            },
          },
          guest: {
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      });

      // Gửi thông báo cho chủ homestay
      if (booking.homestay.ownerId !== guestId) {
        const notificationData = {
          type: 'BOOKING' as any,
          message: `${booking.guest.username} đã đặt phòng ${booking.homestay.name}`,
          senderId: guestId,
          recipientId: booking.homestay.ownerId,
          data: {
            bookingId: booking.id,
            homestayId: booking.homestayId,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
            numberOfGuests: booking.numberOfGuests,
            totalPrice: booking.totalPrice,
          },
        };

        await this.notificationService.createNotification(notificationData);

        // Gửi socket event
        this.socketGateway.emitToUser(booking.homestay.ownerId, 'new_booking', {
          bookingId: booking.id,
          homestayId: booking.homestayId,
          homestayName: booking.homestay.name,
          guestName: booking.guest.username,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          numberOfGuests: booking.numberOfGuests,
          totalPrice: booking.totalPrice,
        });

        this.socketGateway.emitToUser(
          booking.homestay.ownerId,
          'new_notification',
          notificationData,
        );
      }

      return response('Tạo booking thành công', 201, 'success', {
        ...booking,
        numberOfNights,
      });
    } catch (error: any) {
      throw error;
    }
  }

  async getMyBookings(userId: string, status?: string) {
    try {
      const where: any = { guestId: userId };
      if (status) {
        where.status = status;
      }

      const bookings = await this.prisma.booking.findMany({
        where,
        include: {
          homestay: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              country: true,
              imageUrl: true,
              pricePerNight: true,
              currency: true,
              owner: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  phoneNumber: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return response(
        'Lấy danh sách booking thành công',
        200,
        'success',
        bookings,
      );
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  async getBookingsByHomestay(
    homestayId: string,
    ownerId: string,
    status?: string,
  ) {
    try {
      // Verify ownership
      const homestay = await this.prisma.homestay.findUnique({
        where: { id: homestayId },
      });

      if (!homestay) {
        throw new NotFoundException('Không tìm thấy homestay');
      }

      if (homestay.ownerId !== ownerId) {
        throw new ForbiddenException(
          'Bạn không có quyền xem bookings của homestay này',
        );
      }

      const where: any = { homestayId };
      if (status) {
        where.status = status;
      }

      const bookings = await this.prisma.booking.findMany({
        where,
        include: {
          guest: {
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return response(
        'Lấy danh sách booking thành công',
        200,
        'success',
        bookings,
      );
    } catch (error: any) {
      throw error;
    }
  }

  async getBookingById(id: string, userId: string) {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id },
        include: {
          homestay: {
            select: {
              id: true,
              name: true,
              description: true,
              address: true,
              city: true,
              country: true,
              imageUrl: true,
              pricePerNight: true,
              currency: true,
              checkInTime: true,
              checkOutTime: true,
              houseRules: true,
              amenities: true,
              owner: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  email: true,
                  phoneNumber: true,
                },
              },
            },
          },
          guest: {
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      });

      if (!booking) {
        throw new NotFoundException('Không tìm thấy booking');
      }

      // Check permission: only guest or homestay owner can view
      if (booking.guestId !== userId && booking.homestay.owner.id !== userId) {
        throw new ForbiddenException('Bạn không có quyền xem booking này');
      }

      const numberOfNights = Math.ceil(
        (booking.checkOutDate.getTime() - booking.checkInDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      return response('Lấy thông tin booking thành công', 200, 'success', {
        ...booking,
        numberOfNights,
      });
    } catch (error: any) {
      throw error;
    }
  }

  async updateBooking(id: string, userId: string, dto: UpdateBookingDto) {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id },
        include: {
          homestay: {
            select: {
              ownerId: true,
              pricePerNight: true,
              maxGuests: true,
            },
          },
        },
      });

      if (!booking) {
        throw new NotFoundException('Không tìm thấy booking');
      }

      // Check permission: guest can update their booking, owner can update status
      const isGuest = booking.guestId === userId;
      const isOwner = booking.homestay.ownerId === userId;

      if (!isGuest && !isOwner) {
        throw new ForbiddenException('Bạn không có quyền cập nhật booking này');
      }

      // Guest can only update before check-in and if status is pending
      if (isGuest && !isOwner) {
        if (booking.status !== 'pending') {
          throw new BadRequestException(
            'Chỉ có thể cập nhật booking đang pending',
          );
        }
        if (new Date() >= booking.checkInDate) {
          throw new BadRequestException(
            'Không thể cập nhật booking sau ngày check-in',
          );
        }
      }

      // Owner can only update status
      if (isOwner && !isGuest) {
        if (
          dto.status &&
          !['confirmed', 'cancelled', 'completed'].includes(dto.status)
        ) {
          throw new BadRequestException('Trạng thái không hợp lệ');
        }
        // Only allow status update for owner
        const updatedBooking = await this.prisma.booking.update({
          where: { id },
          data: { status: dto.status },
          include: {
            homestay: {
              select: {
                id: true,
                name: true,
                address: true,
                imageUrl: true,
                ownerId: true,
                owner: {
                  select: {
                    username: true,
                  },
                },
              },
            },
            guest: {
              select: {
                id: true,
                username: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // Gửi thông báo cho khách
        let notificationMessage = '';
        if (dto.status === 'confirmed') {
          notificationMessage = `Booking của bạn tại ${updatedBooking.homestay.name} đã được xác nhận`;
        } else if (dto.status === 'cancelled') {
          notificationMessage = `Booking của bạn tại ${updatedBooking.homestay.name} đã bị hủy`;
        } else if (dto.status === 'completed') {
          notificationMessage = `Booking của bạn tại ${updatedBooking.homestay.name} đã hoàn thành`;
        }

        if (notificationMessage) {
          const notificationData = {
            type: 'BOOKING' as any,
            message: notificationMessage,
            senderId: userId,
            recipientId: updatedBooking.guestId,
            data: {
              bookingId: updatedBooking.id,
              homestayId: updatedBooking.homestayId,
              status: updatedBooking.status,
            },
          };

          await this.notificationService.createNotification(notificationData);

          // Gửi socket event
          this.socketGateway.emitToUser(
            updatedBooking.guestId,
            'booking_status_updated',
            {
              bookingId: updatedBooking.id,
              homestayId: updatedBooking.homestayId,
              homestayName: updatedBooking.homestay.name,
              status: updatedBooking.status,
              ownerName: updatedBooking.homestay.owner.username,
            },
          );

          this.socketGateway.emitToUser(
            updatedBooking.guestId,
            'new_notification',
            notificationData,
          );
        }

        return response(
          'Cập nhật trạng thái booking thành công',
          200,
          'success',
          updatedBooking,
        );
      }

      // Guest update: validate and recalculate
      const updateData: any = {};

      if (dto.checkInDate || dto.checkOutDate) {
        const checkIn = dto.checkInDate
          ? new Date(dto.checkInDate)
          : booking.checkInDate;
        const checkOut = dto.checkOutDate
          ? new Date(dto.checkOutDate)
          : booking.checkOutDate;

        if (checkOut <= checkIn) {
          throw new BadRequestException(
            'Ngày check-out phải sau ngày check-in',
          );
        }

        // Check availability for new dates
        if (dto.checkInDate || dto.checkOutDate) {
          const overlapping = await this.prisma.booking.findMany({
            where: {
              id: { not: id },
              homestayId: booking.homestayId,
              status: { in: ['pending', 'confirmed'] },
              OR: [
                {
                  AND: [
                    { checkInDate: { lte: checkIn } },
                    { checkOutDate: { gt: checkIn } },
                  ],
                },
                {
                  AND: [
                    { checkInDate: { lt: checkOut } },
                    { checkOutDate: { gte: checkOut } },
                  ],
                },
                {
                  AND: [
                    { checkInDate: { gte: checkIn } },
                    { checkOutDate: { lte: checkOut } },
                  ],
                },
              ],
            },
          });

          if (overlapping.length > 0) {
            throw new BadRequestException(
              'Homestay đã được đặt trong khoảng thời gian này',
            );
          }
        }

        updateData.checkInDate = checkIn;
        updateData.checkOutDate = checkOut;

        // Recalculate price
        const numberOfNights = Math.ceil(
          (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
        );
        updateData.totalPrice = numberOfNights * booking.homestay.pricePerNight;
      }

      if (dto.numberOfGuests !== undefined) {
        if (dto.numberOfGuests > booking.homestay.maxGuests) {
          throw new BadRequestException(
            `Số lượng khách vượt quá giới hạn (tối đa ${booking.homestay.maxGuests} khách)`,
          );
        }
        updateData.numberOfGuests = dto.numberOfGuests;
      }

      if (dto.specialRequests !== undefined) {
        updateData.specialRequests = dto.specialRequests;
      }

      const updatedBooking = await this.prisma.booking.update({
        where: { id },
        data: updateData,
        include: {
          homestay: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              imageUrl: true,
              pricePerNight: true,
              currency: true,
            },
          },
          guest: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
      });

      return response(
        'Cập nhật booking thành công',
        200,
        'success',
        updatedBooking,
      );
    } catch (error: any) {
      throw error;
    }
  }

  async cancelBooking(id: string, userId: string) {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id },
        include: {
          homestay: {
            select: {
              ownerId: true,
            },
          },
        },
      });

      if (!booking) {
        throw new NotFoundException('Không tìm thấy booking');
      }

      // Only guest or owner can cancel
      if (booking.guestId !== userId && booking.homestay.ownerId !== userId) {
        throw new ForbiddenException('Bạn không có quyền hủy booking này');
      }

      if (booking.status === 'cancelled') {
        throw new BadRequestException('Booking đã được hủy trước đó');
      }

      if (booking.status === 'completed') {
        throw new BadRequestException('Không thể hủy booking đã hoàn thành');
      }

      await this.prisma.booking.update({
        where: { id },
        data: { status: 'cancelled' },
      });

      return response('Hủy booking thành công', 200, 'success');
    } catch (error: any) {
      throw error;
    }
  }

  async deleteBooking(id: string, userId: string) {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id },
      });

      if (!booking) {
        throw new NotFoundException('Không tìm thấy booking');
      }

      // Only guest can delete their own booking
      if (booking.guestId !== userId) {
        throw new ForbiddenException('Bạn không có quyền xóa booking này');
      }

      // Only allow deleting cancelled bookings
      if (booking.status !== 'cancelled') {
        throw new BadRequestException('Chỉ có thể xóa booking đã hủy');
      }

      await this.prisma.booking.delete({
        where: { id },
      });

      return response('Xóa booking thành công', 200, 'success');
    } catch (error: any) {
      throw error;
    }
  }
}
