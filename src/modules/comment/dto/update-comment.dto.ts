import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiPropertyOptional({
    description: 'Updated content of the comment',
    example: 'Amazing place! Definitely recommend visiting.',
  })
  @IsString()
  @IsOptional()
  content?: string;
}
