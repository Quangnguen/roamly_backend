import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
} from 'class-validator';

export class CreateHomestayReviewDto {
  @IsNotEmpty()
  @IsString()
  homestayId: string;

  @IsOptional()
  @IsString()
  bookingId?: string;

  @IsNotEmpty()
  @IsNumber()
  overallRating: number; // 1-5

  @IsOptional()
  @IsNumber()
  cleanRating?: number; // 1-5

  @IsOptional()
  @IsNumber()
  locationRating?: number; // 1-5

  @IsOptional()
  @IsNumber()
  serviceRating?: number; // 1-5

  @IsOptional()
  @IsNumber()
  valueRating?: number; // 1-5

  @IsOptional()
  @IsNumber()
  amenityRating?: number; // 1-5

  @IsNotEmpty()
  @IsString()
  comment: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsIn(['SOLO', 'COUPLE', 'FAMILY', 'FRIENDS', 'BUSINESS'])
  tripType?: string;

  @IsOptional()
  @IsString()
  stayPeriod?: string; // e.g., "3 nights", "1 week"
}
