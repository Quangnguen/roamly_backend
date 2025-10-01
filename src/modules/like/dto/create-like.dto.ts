import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLikeDto {
  @ApiProperty({
    description: 'ID of the post to like',
    example: 'uuid-of-post',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  postId: string;
}
