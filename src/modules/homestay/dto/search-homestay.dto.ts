import {
  IsOptional,
  IsString,
  IsNumber,
  IsIn,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchHomestayDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
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
  type?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value as string))
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value as string))
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value as string))
  @IsNumber()
  guests?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value as string))
  @IsNumber()
  bedrooms?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value as string))
  @IsNumber()
  bathrooms?: number;

  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value as string))
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value as string))
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
