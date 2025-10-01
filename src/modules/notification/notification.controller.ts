// notification.controller.ts
import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  Req,
  Post,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { NotificationType } from '../../../generated/prisma';

@ApiTags('Notifications')
@Controller('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of notifications to retrieve',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of notifications to skip',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAll(
    @Req() req: any,
    @Query('limit') limit = 20,
    @Query('offset') offset = 0,
  ) {
    return this.notificationService.getNotifications(
      req.user.id,
      +limit,
      +offset,
    );
  }

  @Post('test-create')
  @ApiOperation({ summary: 'Test create notification (Development only)' })
  @ApiResponse({
    status: 201,
    description: 'Test notification created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async testCreateNotification(@Body() body: any) {
    return this.notificationService.createNotification({
      type: NotificationType.LIKE,
      message: 'test LIKE notification',
      senderId: body.senderId, // UUID hợp lệ
      recipientId: body.recipientId, // UUID hợp lệ
      postId: body.postId, // UUID hợp lệ (nếu có)
    });
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only mark own notifications',
  })
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationService.markAsRead(id, req.user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async countUnread(@Req() req: any) {
    return this.notificationService.countUnread(req.user.id);
  }
}
