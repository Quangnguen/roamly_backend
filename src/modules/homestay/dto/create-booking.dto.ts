import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsIn,
} from 'class-validator';

export class CreateBookingDto {
  @IsNotEmpty()
  @IsString()
  homestayId: string;

  @IsNotEmpty()
  @IsDateString()
  checkInDate: string;

  @IsNotEmpty()
  @IsDateString()
  checkOutDate: string;

  @IsNotEmpty()
  @IsNumber()
  guests: number;

  @IsOptional()
  @IsString()
  guestName?: string;

  @IsOptional()
  @IsString()
  guestPhone?: string;

  @IsOptional()
  @IsString()
  guestEmail?: string;

  @IsOptional()
  @IsString()
  specialRequests?: string;

  @IsOptional()
  @IsIn(['CREDIT_CARD', 'BANK_TRANSFER', 'PAYPAL', 'CASH', 'OTHER'])
  paymentMethod?: string;
}
