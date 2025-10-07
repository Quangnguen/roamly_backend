import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../common/guard/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('🏠 Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @ApiOperation({
    summary: 'Tạo booking mới',
    description:
      'Đặt homestay cho khoảng thời gian cụ thể. Hệ thống tự động kiểm tra availability và tính tổng giá.',
  })
  @ApiResponse({ status: 201, description: 'Tạo booking thành công' })
  @ApiResponse({
    status: 400,
    description: 'Homestay đã được đặt hoặc thông tin không hợp lệ',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy homestay' })
  @Roles(Role.User, Role.Admin)
  async create(@Req() req: any, @Body() dto: CreateBookingDto) {
    const guestId = req.user.id;
    return this.bookingService.createBooking(guestId, dto);
  }

  @Get('my-bookings')
  @ApiOperation({
    summary: 'Lấy danh sách bookings của tôi',
    description:
      'Lấy tất cả bookings mà user đã tạo, có thể filter theo status',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
  })
  @ApiResponse({ status: 200, description: 'Danh sách bookings' })
  @Roles(Role.User, Role.Admin)
  async getMyBookings(@Req() req: any, @Query('status') status?: string) {
    const userId = req.user.id;
    return this.bookingService.getMyBookings(userId, status);
  }

  @Get('homestay/:homestayId')
  @ApiOperation({
    summary: 'Lấy bookings theo homestay (owner only)',
    description: 'Chủ homestay xem tất cả bookings cho homestay của mình',
  })
  @ApiParam({ name: 'homestayId', description: 'ID của homestay' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
  })
  @ApiResponse({ status: 200, description: 'Danh sách bookings của homestay' })
  @ApiResponse({ status: 403, description: 'Bạn không phải chủ homestay' })
  @Roles(Role.User, Role.Admin)
  async getByHomestay(
    @Param('homestayId') homestayId: string,
    @Req() req: any,
    @Query('status') status?: string,
  ) {
    const ownerId = req.user.id;
    return this.bookingService.getBookingsByHomestay(
      homestayId,
      ownerId,
      status,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết booking',
    description: 'Chỉ guest hoặc owner có thể xem chi tiết booking',
  })
  @ApiParam({ name: 'id', description: 'ID của booking' })
  @ApiResponse({ status: 200, description: 'Thông tin chi tiết booking' })
  @ApiResponse({ status: 403, description: 'Không có quyền xem booking này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy booking' })
  @Roles(Role.User, Role.Admin)
  async getById(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.bookingService.getBookingById(id, userId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật booking',
    description:
      'Guest có thể update thông tin booking (nếu pending). Owner có thể update status (confirm/cancel/complete).',
  })
  @ApiParam({ name: 'id', description: 'ID của booking' })
  @ApiResponse({ status: 200, description: 'Cập nhật booking thành công' })
  @ApiResponse({
    status: 400,
    description: 'Thông tin không hợp lệ hoặc không thể cập nhật',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền cập nhật booking này',
  })
  @Roles(Role.User, Role.Admin)
  async update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateBookingDto,
  ) {
    const userId = req.user.id;
    return this.bookingService.updateBooking(id, userId, dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Hủy booking',
    description: 'Guest hoặc owner có thể hủy booking',
  })
  @ApiParam({ name: 'id', description: 'ID của booking' })
  @ApiResponse({ status: 200, description: 'Hủy booking thành công' })
  @ApiResponse({
    status: 400,
    description: 'Booking đã được hủy hoặc đã hoàn thành',
  })
  @ApiResponse({ status: 403, description: 'Không có quyền hủy booking này' })
  @Roles(Role.User, Role.Admin)
  async cancel(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.bookingService.cancelBooking(id, userId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa booking',
    description: 'Guest có thể xóa booking đã hủy của mình',
  })
  @ApiParam({ name: 'id', description: 'ID của booking' })
  @ApiResponse({ status: 200, description: 'Xóa booking thành công' })
  @ApiResponse({ status: 400, description: 'Chỉ có thể xóa booking đã hủy' })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa booking này' })
  @Roles(Role.User, Role.Admin)
  async remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.bookingService.deleteBooking(id, userId);
  }
}
