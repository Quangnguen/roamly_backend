// 📁 comment.controller.ts
// ===============================
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  Patch,
  Query,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  async createComment(
    @Req() req,
    @Body() body: { postId: string; content: string; parentId?: string },
  ) {
    return this.commentService.createComment(
      body.postId,
      req.user.id,
      body.content,
      body.parentId,
    );
  }

  @Get(':postId')
  async getComments(@Param('postId') postId: string, @Req() req) {
    const userId = req.user?.id;
    return this.commentService.getComments(postId, userId);
  }

  @Delete(':id')
  async deleteComment(@Param('id') id: string, @Req() req) {
    return this.commentService.deleteComment(req.user.id, id);
  }
  @Patch(':id')
  updateComment(
    @Req() req,
    @Param('id') commentId: string,
    @Body('content') content: string,
  ) {
    return this.commentService.updateComment(req.user.id, commentId, content);
  }
}
