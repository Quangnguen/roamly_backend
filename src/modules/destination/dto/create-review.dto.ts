import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateDestinationReviewDto {
  @ApiProperty({
    description: 'Rating for the destination (1-5)',
    example: 4.5,
    minimum: 1,
    maximum: 5,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating: number;

  @ApiPropertyOptional({
    description: 'Review comment',
    example: 'Beautiful place with amazing views!',
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({
    description: 'Date of visit',
    example: '2025-09-15',
  })
  @IsOptional()
  visitDate?: string;

  @ApiPropertyOptional({
    description: 'Upload review images',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  images?: Express.Multer.File[];
}
