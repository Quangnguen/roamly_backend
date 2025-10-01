import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'ID of the post to comment on',
    example: 'uuid-of-post',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  postId: string;

  @ApiProperty({
    description: 'Content of the comment',
    example: 'Beautiful place! I want to visit there someday.',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Parent comment ID for replies',
    example: 'uuid-of-parent-comment',
  })
  @IsString()
  @IsOptional()
  parentId?: string;
}
