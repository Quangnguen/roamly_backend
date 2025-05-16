/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { CustomValidationPipe } from 'src/common/pipe/validation.pipe';

@Controller('auth')
@UsePipes(new CustomValidationPipe())
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    console.log('register');
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any) {
    const userId = req.user.id;
    await this.authService.logout(userId);
    return { message: 'Đăng xuất thành công' };
  }
}
