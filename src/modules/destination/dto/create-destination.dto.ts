import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  IsArray,
} from 'class-validator';

export class CreateDestinationDto {
  @IsNotEmpty()
  @IsString()
  name: string;

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

  @IsOptional()
  @IsIn(['FREE', 'BUDGET', 'MID_RANGE', 'LUXURY', 'PREMIUM'])
  priceRange?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  openingHours?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  images?: string[];
}
