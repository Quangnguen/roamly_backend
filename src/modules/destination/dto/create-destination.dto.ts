import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDestinationDto {
  @ApiProperty({
    example: 'Hạ Long Bay',
    description: 'Tên địa điểm du lịch',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Vịnh Hạ Long là một vịnh nhỏ thuộc phần tây bắc Vịnh Bắc Bộ...',
    description: 'Mô tả chi tiết về địa điểm',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({
    example: 'Vịnh Hạ Long - Di sản thế giới',
    description: 'Mô tả ngắn gọn',
  })
  @IsOptional()
  @IsString()
  shortDesc?: string;

  @ApiProperty({
    example: 'Hạ Long, Quảng Ninh',
    description: 'Địa chỉ',
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({
    example: 'Hạ Long',
    description: 'Thành phố',
  })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({
    example: 'Vietnam',
    description: 'Quốc gia',
  })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiPropertyOptional({
    example: 20.9101,
    description: 'Vĩ độ',
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    example: 107.1839,
    description: 'Kinh độ',
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({
    example: 'ATTRACTION',
    description: 'Loại địa điểm du lịch',
    enum: [
      'RESTAURANT',
      'HOTEL',
      'ATTRACTION',
      'MUSEUM',
      'PARK',
      'BEACH',
      'MOUNTAIN',
      'TEMPLE',
      'SHOPPING',
      'NIGHTLIFE',
      'CULTURAL',
      'ADVENTURE',
      'NATURE',
      'HISTORICAL',
      'ENTERTAINMENT',
      'WELLNESS',
      'FESTIVAL',
      'MARKET',
      'TRANSPORT',
      'ACCOMMODATION',
      'ACTIVITY',
      'OTHER',
    ],
  })
  @IsIn([
    'RESTAURANT',
    'HOTEL',
    'ATTRACTION',
    'MUSEUM',
    'PARK',
    'BEACH',
    'MOUNTAIN',
    'TEMPLE',
    'SHOPPING',
    'NIGHTLIFE',
    'CULTURAL',
    'ADVENTURE',
    'NATURE',
    'HISTORICAL',
    'ENTERTAINMENT',
    'WELLNESS',
    'FESTIVAL',
    'MARKET',
    'TRANSPORT',
    'ACCOMMODATION',
    'ACTIVITY',
    'OTHER',
  ])
  category: string;

  @ApiPropertyOptional({
    example: 'MID_RANGE',
    description: 'Mức giá',
    enum: ['FREE', 'BUDGET', 'MID_RANGE', 'LUXURY', 'PREMIUM'],
  })
  @IsOptional()
  @IsIn(['FREE', 'BUDGET', 'MID_RANGE', 'LUXURY', 'PREMIUM'])
  priceRange?: string;

  @ApiPropertyOptional({
    example: 'https://example.com',
    description: 'Website chính thức',
  })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({
    example: '0123456789',
    description: 'Số điện thoại liên hệ',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'info@example.com',
    description: 'Email liên hệ',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    example: '8:00 AM - 5:00 PM',
    description: 'Giờ mở cửa',
  })
  @IsOptional()
  @IsString()
  openingHours?: string;

  @ApiPropertyOptional({
    example: ['WiFi', 'Parking', 'Restaurant'],
    description: 'Các tiện ích có sẵn',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({
    example: ['scenic', 'family-friendly', 'popular'],
    description: 'Các thẻ tag',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Hình ảnh địa điểm (có thể upload nhiều file)',
  })
  @IsOptional()
  @IsArray()
  images?: string[];
}
