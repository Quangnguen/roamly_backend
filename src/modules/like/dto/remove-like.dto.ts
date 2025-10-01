import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveLikeDto {
  @ApiProperty({
    description: 'ID of the post to unlike',
    example: 'uuid-of-post',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  postId: string;
}
