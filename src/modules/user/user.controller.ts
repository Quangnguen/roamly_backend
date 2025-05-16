import {
  Controller,
  Get,
  Patch,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  UsePipes,
  UploadedFile,
  UseInterceptors,
  Delete,
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
  @Patch(':id/profile-pic')
  @UseInterceptors(FileInterceptor('file'))
  async updateProfilePic(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.updateProfilePic(req.user.id, file);
  }
}
