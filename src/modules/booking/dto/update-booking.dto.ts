import { PartialType } from '@nestjs/swagger';
import { CreateBookingDto } from './create-booking.dto';
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBookingDto extends PartialType(CreateBookingDto) {
  @ApiProperty({
    description: 'Trạng thái booking',
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}
