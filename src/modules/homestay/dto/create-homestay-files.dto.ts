import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHomestayFilesDto {
  @ApiProperty({
    description: 'Title of the homestay',
    example: 'Cozy Beach Villa in Da Nang',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Detailed description of the homestay',
    example:
      'Beautiful 3-bedroom villa located just 100m from My Khe Beach. Perfect for families and groups looking for a relaxing getaway.',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: 'Short description/summary',
    example: 'Beach villa with stunning ocean views',
  })
  @IsOptional()
  @IsString()
  shortDesc?: string;

  @ApiProperty({
    description: 'Full address of the homestay',
    example: '123 Vo Nguyen Giap Street, Phuoc My Ward',
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({
    description: 'City where homestay is located',
    example: 'Da Nang',
  })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({
    description: 'Country where homestay is located',
    example: 'Vietnam',
  })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiPropertyOptional({
    description: 'Latitude coordinate',
    example: 16.0544,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate',
    example: 108.2022,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({
    description: 'Type of accommodation',
    example: 'VILLA',
    enum: [
      'APARTMENT',
      'HOUSE',
      'VILLA',
      'ROOM',
      'STUDIO',
      'LOFT',
      'CABIN',
      'COTTAGE',
      'BUNGALOW',
      'HOSTEL',
      'OTHER',
    ],
  })
  @IsIn([
    'APARTMENT',
    'HOUSE',
    'VILLA',
    'ROOM',
    'STUDIO',
    'LOFT',
    'CABIN',
    'COTTAGE',
    'BUNGALOW',
    'HOSTEL',
    'OTHER',
  ])
  type: string;

  @ApiProperty({
    description: 'Price per night in VND',
    example: 1500000,
  })
  @IsNumber()
  pricePerNight: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'VND',
    default: 'VND',
  })
  @IsOptional()
  @IsString()
  currency?: string = 'VND';

  @ApiProperty({
    description: 'Maximum number of guests',
    example: 6,
  })
  @IsNumber()
  maxGuests: number;

  @ApiProperty({
    description: 'Number of bedrooms',
    example: 3,
  })
  @IsNumber()
  bedrooms: number;

  @ApiProperty({
    description: 'Number of bathrooms',
    example: 2,
  })
  @IsNumber()
  bathrooms: number;

  @ApiPropertyOptional({
    description: 'Total number of beds',
    example: 4,
  })
  @IsOptional()
  @IsNumber()
  beds?: number;

  @ApiPropertyOptional({
    description: 'Available amenities',
    example: ['WiFi', 'Pool', 'Kitchen', 'Air Conditioning', 'Beach Access'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  amenities?: string[];

  @ApiPropertyOptional({
    description: 'Check-in time',
    example: '14:00',
  })
  @IsOptional()
  @IsString()
  checkInTime?: string;

  @ApiPropertyOptional({
    description: 'Check-out time',
    example: '12:00',
  })
  @IsOptional()
  @IsString()
  checkOutTime?: string;

  @ApiPropertyOptional({
    description: 'House rules',
    example: ['No smoking', 'No pets', 'No parties'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  houseRules?: string[];

  @ApiPropertyOptional({
    description: 'Cancellation policy',
    example: 'Free cancellation up to 24 hours before check-in',
  })
  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @ApiPropertyOptional({
    description: 'Minimum stay in nights',
    example: 2,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  minStay?: number = 1;

  @ApiPropertyOptional({
    description: 'Maximum stay in nights',
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  maxStay?: number;

  @ApiPropertyOptional({
    description: 'Instant booking available',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  instantBook?: boolean = false;

  @ApiPropertyOptional({
    description: 'Host name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  hostName?: string;

  @ApiPropertyOptional({
    description: 'Host phone number',
    example: '+84901234567',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Host email address',
    example: 'host@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  // File upload field
  @ApiPropertyOptional({
    description: 'Upload multiple images for the homestay (max 10 files)',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  images?: Express.Multer.File[];
}
