import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  Min,
  IsEmail,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHomestayDto {
  @ApiProperty({ description: 'Tên homestay' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Địa chỉ' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Thành phố' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'Quốc gia' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ description: 'Vĩ độ' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Kinh độ' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Số điện thoại', type: String })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Email', type: String })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Website', type: String })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({ description: 'Giá mỗi đêm' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerNight: number;

  @ApiPropertyOptional({ description: 'Đơn vị tiền tệ', default: 'VND' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Số khách tối đa', default: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxGuests?: number;

  @ApiPropertyOptional({ description: 'Số phòng ngủ', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  bedrooms?: number;

  @ApiPropertyOptional({ description: 'Số giường', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  beds?: number;

  @ApiPropertyOptional({ description: 'Số phòng tắm', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  bathrooms?: number;

  @ApiPropertyOptional({ description: 'Tiện nghi', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ description: 'Nội quy', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  houseRules?: string[];

  @ApiPropertyOptional({ description: 'Giờ check-in', default: '14:00' })
  @IsOptional()
  @IsString()
  checkInTime?: string;

  @ApiPropertyOptional({ description: 'Giờ check-out', default: '12:00' })
  @IsOptional()
  @IsString()
  checkOutTime?: string;

  @ApiPropertyOptional({
    description: 'ID địa điểm (nếu homestay thuộc về destination)',
  })
  @IsOptional()
  @IsString()
  destinationId?: string;

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
