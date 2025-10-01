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

export class CreateHomestayDto {
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
    description: 'Check-in time',
    example: '14:00',
  })
  @IsOptional()
  @IsString()
  checkInTime?: string;

  @ApiPropertyOptional({
    description: 'Check-out time',
    example: '11:00',
  })
  @IsOptional()
  @IsString()
  checkOutTime?: string;

  @ApiPropertyOptional({
    description: 'Minimum stay requirement (nights)',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  minStay?: number;

  @ApiPropertyOptional({
    description: 'Maximum stay allowed (nights)',
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  maxStay?: number;

  @ApiPropertyOptional({
    description: 'List of amenities available',
    example: [
      'WiFi',
      'Swimming Pool',
      'Air Conditioning',
      'Kitchen',
      'Parking',
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({
    description: 'House rules for guests',
    example: ['No smoking', 'No pets', 'Quiet hours 10PM-8AM'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  houseRules?: string[];

  @ApiPropertyOptional({
    description: 'Cancellation policy details',
    example: 'Free cancellation up to 24 hours before check-in',
  })
  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @ApiPropertyOptional({
    description: 'Allow instant booking without host approval',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  instantBook?: boolean = false;

  @ApiPropertyOptional({
    description: 'Contact phone number',
    example: '+84 901 234 567',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Contact email address',
    example: 'host@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Array of image URLs (uploaded separately)',
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  images?: string[];
}
