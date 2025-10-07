import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ description: 'ID của homestay muốn đặt' })
  @IsString()
  @IsNotEmpty()
  homestayId: string;

  @ApiProperty({
    description: 'Ngày check-in (ISO 8601 format)',
    example: '2025-10-15T14:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  checkInDate: string;

  @ApiProperty({
    description: 'Ngày check-out (ISO 8601 format)',
    example: '2025-10-18T12:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  checkOutDate: string;

  @ApiProperty({ description: 'Số lượng khách', example: 2, default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  numberOfGuests?: number;

  @ApiProperty({ description: 'Yêu cầu đặc biệt', required: false })
  @IsString()
  @IsOptional()
  specialRequests?: string;
}
