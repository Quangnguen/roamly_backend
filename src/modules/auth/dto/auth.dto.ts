/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Chưa đúng định dạng email' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString({ message: 'Tên đăng nhập là kiểu chuỗi' })
  @MinLength(3, { message: 'Tên đăng nhập phải có ít nhất 3 ký tự' })
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  username: string;
  @IsString({ message: 'Số điện thoại là kiểu chuỗi' })
  @Matches(/^[0-9]{10,11}$/, {
    message: 'Số điện thoại phải có 10 hoặc 11 chữ số',
  })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  phoneNumber: string;

  @IsString({ message: 'Mật khẩu là kiểu chuỗi' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(3, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  password: string;

  @IsString({ message: 'Tên là kiểu chuỗi' })
  @IsNotEmpty({ message: 'Tên không được để trống' })
  name: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Chưa đúng định dạng email' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString({ message: 'Mật khẩu là kiểu chuỗi' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;
}
