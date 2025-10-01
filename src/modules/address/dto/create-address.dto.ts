import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  IsArray,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({
    description: 'Name of the address/location',
    example: 'Hanoi',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Full name of the address/location',
    example: 'Hanoi Capital City',
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'English name of the address/location',
    example: 'Hanoi',
  })
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiProperty({
    description: 'URL-friendly slug for the address',
    example: 'hanoi',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({
    description: 'Type of administrative division',
    enum: ['COUNTRY', 'PROVINCE', 'DISTRICT', 'WARD', 'AREA'],
    example: 'PROVINCE',
    required: true,
  })
  @IsIn(['COUNTRY', 'PROVINCE', 'DISTRICT', 'WARD', 'AREA'])
  type: string;

  @ApiPropertyOptional({
    description: 'Latitude coordinate',
    example: 21.0285,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate',
    example: 105.8542,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Area in square kilometers',
    example: 3323.6,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  area?: number;

  @ApiPropertyOptional({
    description: 'Population count',
    example: 8053663,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  population?: number;

  @ApiPropertyOptional({
    description: 'Detailed description of the location',
    example: 'Hanoi is the capital city of Vietnam...',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Short description of the location',
    example: 'Capital city of Vietnam',
  })
  @IsOptional()
  @IsString()
  shortDesc?: string;

  @ApiPropertyOptional({
    description: 'Key highlights of the location',
    type: [String],
    example: ['Old Quarter', 'Hoan Kiem Lake', 'Temple of Literature'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];

  @ApiPropertyOptional({
    description: 'Cover image URL',
    example: 'https://example.com/hanoi-cover.jpg',
  })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({
    description: 'Array of image URLs',
    type: [String],
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({
    description: 'Best time to visit this location',
    example: 'October to April',
  })
  @IsOptional()
  @IsString()
  bestTimeToVisit?: string;

  @ApiPropertyOptional({
    description: 'Climate information',
    example: 'Tropical monsoon climate',
  })
  @IsOptional()
  @IsString()
  climate?: string;

  @ApiPropertyOptional({
    description: 'What the location is famous for',
    type: [String],
    example: ['Street food', 'Historical sites', 'Cultural heritage'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  famousFor?: string[];

  @ApiPropertyOptional({
    description: 'Parent address ID (for hierarchical structure)',
    example: 'uuid-of-parent-address',
    format: 'uuid',
  })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({
    description:
      'Administrative level (0=Country, 1=Province, 2=District, 3=Ward, 4=Area)',
    minimum: 0,
    maximum: 4,
    example: 1,
    required: true,
  })
  @IsNumber()
  @Min(0)
  @Max(4)
  level: number;

  @ApiPropertyOptional({
    description: 'Path array for hierarchical navigation',
    type: [String],
    example: ['vietnam', 'hanoi'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  path?: string[];

  @ApiPropertyOptional({
    description: 'Whether the address is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({
    description: 'Whether this is a priority location',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPriority?: boolean = false;
}
