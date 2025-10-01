// like.controller.ts
import { Controller, Post, Delete, Body, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LikeService } from './like.service';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';

@ApiTags('likes')
@Controller('likes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post()
  @ApiOperation({ summary: 'Thích bài viết/địa điểm' })
  @ApiResponse({ status: 201, description: 'Thích thành công' })
  async like(
    @Req() req: any,
    @Body() body: { targetId: string; type: string },
  ) {
    const result = await this.likeService.like(
      req.user.id,
      body.targetId,
      body.type,
    );
    return result;
  }

  @Delete()
  async unlike(
    @Req() req: any,
    @Body() body: { targetId: string; type: string },
  ) {
    const result = await this.likeService.unlike(
      req.user.id,
      body.targetId,
      body.type,
    );
    return result;
  }
}
