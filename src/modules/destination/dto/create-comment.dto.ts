import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDestinationCommentDto {
  @ApiProperty({
    description: 'Comment content',
    example: 'This place is amazing! Highly recommended!',
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'Parent comment ID (for replies)',
    example: 'uuid-of-parent-comment',
  })
  @IsOptional()
  @IsString()
  parentId?: string;
}
