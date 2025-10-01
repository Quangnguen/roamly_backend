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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { CustomValidationPipe } from 'src/common/pipe/validation.pipe';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UploadAvatarDto } from './dto/upload-avatar.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@UsePipes(new CustomValidationPipe())
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin người dùng hiện tại' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @HttpCode(HttpStatus.OK)
  async getMe(@Req() req: any) {
    return this.userService.getUserById(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @HttpCode(HttpStatus.OK)
  async updateMe(@Req() req: any, @Body() dto: UpdateUserDto) {
    return this.userService.updateUser(req.user.id, dto);
  }

  @Get('get-users')
  @ApiOperation({ summary: 'Lấy danh sách người dùng (phân trang)' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
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
  @ApiOperation({
    summary: 'Upload avatar',
    description: 'Upload profile picture from gallery or camera',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Avatar uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(FileInterceptor('file'))
  async updateProfilePic(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadAvatarDto,
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
