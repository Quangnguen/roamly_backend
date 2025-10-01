import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiPropertyOptional({
    description: 'Caption/content of the post',
    example: 'Amazing sunset at Da Nang beach! #travel #sunset #vietnam',
  })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({
    description: 'Upload multiple images for the post',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  images?: Express.Multer.File[];
}
