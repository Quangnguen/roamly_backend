// like.controller.ts
import { Controller, Post, Delete, Body, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { LikeService } from './like.service';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { LikeDto } from './dto/like.dto';

@ApiTags('👍 Likes')
@ApiBearerAuth('JWT-auth')
@Controller('likes')
@UseGuards(JwtAuthGuard)
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post()
  @ApiOperation({
    summary: 'Like một post/comment/destination/homestay',
    description: `
    Thích một đối tượng (post, comment, destination, hoặc homestay).
    
    **Type values:**
    - \`post\` - Like một bài viết
    - \`comment\` - Like một comment
    - \`destination\` - Like một địa điểm du lịch
    - \`homestay\` - Like một homestay
    
    **UserId:**
    - Mặc định lấy từ JWT token của user đang login
    - Có thể truyền \`userId\` trong body để override (dùng cho testing/admin)
    - Nếu không truyền \`userId\`, sẽ tự động dùng user từ token
    
    **Kết quả:**
    - Tăng likeCount của đối tượng
    - Tạo notification cho chủ đối tượng (nếu khác người like)
    - Emit socket event real-time
    `,
  })
  @ApiBody({ type: LikeDto })
  @ApiResponse({
    status: 201,
    description: 'Like thành công',
    schema: {
      example: {
        message: 'Đã thích bài viết',
        statusCode: 201,
        status: 'success',
        data: {
          id: 'like-id',
          userId: 'user-id',
          targetId: 'target-id',
          type: 'post',
          createdAt: '2025-10-03T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Đã like rồi hoặc dữ liệu không hợp lệ',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đối tượng' })
  async like(@Req() req: any, @Body() body: LikeDto) {
    // Use userId from body if provided (for testing/admin), otherwise use from JWT token
    const userId = body.userId || req.user.id;
    const result = await this.likeService.like(
      userId,
      body.targetId,
      body.type,
    );
    return result;
  }

  @Delete()
  @ApiOperation({
    summary: 'Unlike một post/comment/destination/homestay',
    description: `
    Bỏ thích một đối tượng (post, comment, hoặc destination).
    
    **Type values:**
    - \`post\` - Unlike một bài viết
    - \`comment\` - Unlike một comment
    - \`destination\` - Unlike một địa điểm du lịch
    
    **UserId:**
    - Mặc định lấy từ JWT token của user đang login
    - Có thể truyền \`userId\` trong body để override (dùng cho testing/admin)
    - Nếu không truyền \`userId\`, sẽ tự động dùng user từ token
    
    **Kết quả:**
    - Giảm likeCount của đối tượng
    - Emit socket event real-time
    `,
  })
  @ApiBody({ type: LikeDto })
  @ApiResponse({
    status: 200,
    description: 'Unlike thành công',
    schema: {
      example: {
        message: 'Đã bỏ thích',
        statusCode: 200,
        status: 'success',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Chưa like hoặc dữ liệu không hợp lệ',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đối tượng' })
  async unlike(@Req() req: any, @Body() body: LikeDto) {
    // Use userId from body if provided (for testing/admin), otherwise use from JWT token
    const userId = body.userId || req.user.id;
    const result = await this.likeService.unlike(
      userId,
      body.targetId,
      body.type,
    );
    return result;
  }
}
