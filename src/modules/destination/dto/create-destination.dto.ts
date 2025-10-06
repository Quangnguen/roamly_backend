import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateDestinationDto {
  @ApiProperty({
    description: 'Title of the destination',
    example: 'Hoi An Ancient Town',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed description',
    example:
      'A beautiful ancient town with colorful lanterns and historic architecture.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Location address',
    example: 'Hoi An, Quang Nam',
  })
  @IsNotEmpty()
  @IsString()
  location: string;

  @ApiProperty({
    description: 'City name',
    example: 'Hoi An',
  })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({
    description: 'Country name',
    example: 'Vietnam',
  })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiPropertyOptional({
    description: 'Latitude',
    example: 15.8801,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude',
    example: 108.338,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Categories',
    type: [String],
    example: ['historical', 'cultural'],
  })
  @IsOptional()
  @IsArray()
  category?: string[];

  @ApiPropertyOptional({
    description: 'Tags',
    type: [String],
    example: ['ancient-town', 'lanterns'],
  })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Best time to visit',
    example: 'February to May',
  })
  @IsOptional()
  @IsString()
  bestTimeToVisit?: string;

  @ApiPropertyOptional({
    description: 'Entry fee (JSON)',
    example: { adult: 120000, child: 60000, currency: 'VND' },
  })
  @IsOptional()
  entryFee?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Opening hours',
    example: '8:00 AM - 10:00 PM',
  })
  @IsOptional()
  @IsString()
  openingHours?: string;

  @ApiPropertyOptional({
    description: 'Facilities',
    type: [String],
    example: ['parking', 'restaurant', 'wifi'],
  })
  @IsOptional()
  @IsArray()
  facilities?: string[];

  @ApiPropertyOptional({
    description: 'Activities',
    type: [String],
    example: ['walking-tour', 'boat-ride'],
  })
  @IsOptional()
  @IsArray()
  activities?: string[];

  @ApiPropertyOptional({
    description: 'Travel tips',
    type: [String],
    example: ['Wear comfortable shoes', 'Visit in evening'],
  })
  @IsOptional()
  @IsArray()
  travelTips?: string[];

  @ApiPropertyOptional({
    description:
      'Parent destination ID (for sub-locations). Send empty string to remove parent.',
    example: 'uuid-of-ninh-binh',
  })
  @IsOptional()
  @IsString()
  parentId?: string | null;

  @ApiPropertyOptional({
    description: 'Is public',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Upload images',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  images?: Express.Multer.File[];
}
