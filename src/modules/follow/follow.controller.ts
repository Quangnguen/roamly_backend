// follow.controller.ts
import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FollowService } from './follow.service';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { CreateFollowDto } from './dto/create-follow.dto';
import { UpdateFollowStatusDto } from './dto/update-follow-status.dto';

@ApiTags('follows')
@Controller('follows')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post()
  @ApiOperation({ summary: 'Theo dõi người dùng' })
  @ApiResponse({ status: 201, description: 'Theo dõi thành công' })
  async follow(@Req() req: any, @Body() dto: CreateFollowDto) {
    return this.followService.createFollow(req.user.id, dto);
  }

  @Get('following')
  async getFollowing(@Req() req: any) {
    return this.followService.getFollowing(req.user.id);
  }

  @Get('followers')
  async getFollowers(@Req() req: any) {
    return this.followService.getFollowers(req.user.id);
  }

  @Get('status/:userId')
  async checkStatus(@Req() req: any, @Param('userId') userId: string) {
    return this.followService.checkFollowStatus(req.user.id, userId);
  }

  @Patch(':followerId')
  async updateStatus(
    @Req() req: any,
    @Param('followerId') followerId: string,
    @Body() dto: UpdateFollowStatusDto,
  ) {
    return this.followService.updateFollowStatus(req.user.id, followerId, dto);
  }

  @Delete(':followingId')
  async unfollow(@Req() req: any, @Param('followingId') followingId: string) {
    return this.followService.deleteFollow(req.user.id, followingId);
  }
}
