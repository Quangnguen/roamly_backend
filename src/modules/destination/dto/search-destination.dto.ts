import { IsOptional, IsString, IsNumber, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchDestinationDto {
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
  category?: string;

  @IsOptional()
  @IsIn(['FREE', 'BUDGET', 'MID_RANGE', 'LUXURY', 'PREMIUM'])
  priceRange?: string;

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
