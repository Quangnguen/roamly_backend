import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  IsArray,
  IsBoolean,
} from 'class-validator';

export class CreateHomestayDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  shortDesc?: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  country: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

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

  @IsNumber()
  pricePerNight: number;

  @IsOptional()
  @IsString()
  currency?: string = 'VND';

  @IsNumber()
  maxGuests: number;

  @IsNumber()
  bedrooms: number;

  @IsNumber()
  bathrooms: number;

  @IsOptional()
  @IsNumber()
  beds?: number;

  @IsOptional()
  @IsString()
  checkInTime?: string;

  @IsOptional()
  @IsString()
  checkOutTime?: string;

  @IsOptional()
  @IsNumber()
  minStay?: number;

  @IsOptional()
  @IsNumber()
  maxStay?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  houseRules?: string[];

  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @IsOptional()
  @IsBoolean()
  instantBook?: boolean = false;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsArray()
  images?: string[];
}
