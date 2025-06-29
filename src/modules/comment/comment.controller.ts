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
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) { }

  @Post()
  async createComment(
    @Req() req: { user: { id: string } },
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
  async getComments(@Param('postId') postId: string) {
    return this.commentService.getComments(postId);
  }

  @Delete(':id')
  async deleteComment(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.commentService.deleteComment(req.user.id, id);
  }
  @Patch(':id')
  updateComment(
    @Req() req: { user: { id: string } },
    @Param('id') commentId: string,
    @Body('content') content: string,
  ) {
    return this.commentService.updateComment(req.user.id, commentId, content);
  }
}
