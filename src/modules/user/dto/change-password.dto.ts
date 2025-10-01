import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'oldPassword123',
    required: true,
  })
  @IsString()
  oldPassword: string;

  @ApiProperty({
    description: 'New password (minimum 6 characters)',
    example: 'newPassword456',
    minLength: 6,
    required: true,
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
