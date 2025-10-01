// 📁 chat.controller.ts
// ===============================
import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Put,
  Body,
  Param,
  Req,
  Query,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversation')
  async createConversation(
    @Req() req,
    @Body() body: { userIds: string[]; name?: string },
  ) {
    return this.chatService.createConversation(
      req.user.id,
      body.userIds,
      body.name,
    );
  }
  @Get('message/:conversationId')
  async getMessages(
    @Req() req,
    @Param('conversationId') conversationId: string,
    @Query('limit') limit: string,
    @Query('before') before?: string,
  ) {
    const parsedLimit = parseInt(limit) || 20;
    return this.chatService.getMessages(
      req.user.id,
      conversationId,
      parsedLimit,
      before,
    );
  }

  @Get('conversation')
  async getMyConversations(@Req() req) {
    return this.chatService.getUserConversations(req.user.id);
  }

  @Get('conversation/:id/members')
  async getConversationMembers(@Param('id') id: string) {
    return this.chatService.getConversationMembers(id);
  }

  @Post('message')
  @UseInterceptors(FilesInterceptor('files'))
  async sendMessage(
    @Req() req,
    @Body() body: { conversationId: string; content?: string },
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.chatService.sendMessage(
      req.user.id,
      body.conversationId,
      body.content || '',
      files || [],
    );
  }

  @Patch('message/:id')
  async editMessage(
    @Param('id') id: string,
    @Req() req,
    @Body() body: { content: string },
  ) {
    return this.chatService.editMessage(req.user.id, id, body.content);
  }

  @Delete('message/:id')
  async deleteMessage(@Param('id') id: string, @Req() req) {
    return this.chatService.deleteMessage(req.user.id, id);
  }

  @Post('seen/:conversationId')
  async markAsSeen(
    @Param('conversationId') conversationId: string,
    @Req() req,
  ) {
    return this.chatService.markAsSeen(req.user.id, conversationId);
  }

  @Post('reaction')
  async reactToMessage(
    @Req() req,
    @Body() body: { messageId: string; reaction: string },
  ) {
    return this.chatService.reactToMessage(
      req.user.id,
      body.messageId,
      body.reaction,
    );
  }

  @Get('reaction/:messageId')
  async getReactions(@Param('messageId') messageId: string) {
    return this.chatService.getReactions(messageId);
  }

  @Post('typing/:conversationId')
  async sendTypingStatus(
    @Req() req,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chatService.sendTypingStatus(req.user.id, conversationId);
  }

  @Post('pin/:messageId')
  async pinMessage(@Req() req, @Param('messageId') messageId: string) {
    return this.chatService.pinMessage(req.user.id, messageId);
  }
  @Patch('pin/:messageId')
  async unpinMessage(@Req() req, @Param('messageId') messageId: string) {
    return this.chatService.unpinMessage(req.user.id, messageId);
  }
  @Get('pinned/:conversationId')
  getPinned(@Param('conversationId') id: string) {
    return this.chatService.getPinnedMessages(id);
  }
}
