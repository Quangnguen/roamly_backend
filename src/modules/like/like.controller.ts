// like.controller.ts
import { Controller, Post, Delete, Body, UseGuards, Req } from '@nestjs/common';
import { LikeService } from './like.service';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';

@Controller('likes')
@UseGuards(JwtAuthGuard)
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post()
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
