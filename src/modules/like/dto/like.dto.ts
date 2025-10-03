import { IsString, IsIn, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LikeDto {
  @ApiProperty({
    description: 'ID của đối tượng cần like (post, comment, hoặc destination)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({
    description: 'Loại đối tượng cần like',
    enum: ['post', 'comment', 'destination'],
    example: 'post',
  })
  @IsString()
  @IsIn(['post', 'comment', 'destination'], {
    message: 'type phải là post, comment hoặc destination',
  })
  type: string;

  @ApiPropertyOptional({
    description:
      'ID của user thực hiện like (Optional - Mặc định lấy từ JWT token. Chỉ dùng khi cần override cho testing hoặc admin)',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString()
  @IsOptional()
  userId?: string;
}
