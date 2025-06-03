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
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { NotificationType } from '../../../generated/prisma';
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
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
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationService.markAsRead(id, req.user.id);
  }

  @Get('unread-count')
  async countUnread(@Req() req: any) {
    return this.notificationService.countUnread(req.user.id);
  }
}
