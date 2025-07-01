/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
import {
  Controller,
  Get,
  Patch,
  Body,
  Req,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UsePipes,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { CustomValidationPipe } from 'src/common/pipe/validation.pipe';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';
@Controller('users')
@UseGuards(JwtAuthGuard)
@UsePipes(new CustomValidationPipe())
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@Req() req: any) {
    return this.userService.getUserById(req.user.id);
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  async updateMe(@Req() req: any, @Body() dto: UpdateUserDto) {
    return this.userService.updateUser(req.user.id, dto);
  }

  @Get('get-users')
  @HttpCode(HttpStatus.OK)
  async getUsers(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    console.log('page:', page, 'limit:', limit, 'user:', req.user);
    return this.userService.getUsers(req.user.id, page, limit);
  }

  @Patch('soft-delete')
  @HttpCode(HttpStatus.OK)
  async softDeleteMe(@Req() req: any) {
    return this.userService.softDeleteUser(req.user.id);
  }

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(req.user.id, dto);
  }

  @Patch('profile-pic')
  @UseInterceptors(FileInterceptor('file'))
  async updateProfilePic(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.updateProfilePic(req.user.id, file);
  }
  @Get('search')
  @HttpCode(HttpStatus.OK)
  async search(
    @Req() req: any,
    @Query('q') q: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const parsedLimit = parseInt(limit) || 20;
    const take = parseInt(page) || 1;
    return this.userService.searchUsers(q, req.user.id, take, parsedLimit);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getUserById(@Req() req: any) {
    return this.userService.getUserById(req.params.id);
  }
}
