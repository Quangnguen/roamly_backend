import {
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTripDto {
  @ApiProperty({
    description: 'Title of the trip memory',
    example: 'Amazing Trip to Da Nang',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the trip',
    example:
      'A wonderful 3-day trip exploring the beautiful beaches and culture of Da Nang',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Start date of the trip',
    example: '2024-01-15T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date of the trip',
    example: '2024-01-18T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Cost breakdown of the trip',
    example: { meals: 100, transport: 200, accommodation: 150, total: 450 },
  })
  @IsObject()
  @IsOptional()
  @IsNotEmpty()
  cost: object; // ví dụ: { meals: 100, transport: 200, total: 300 }

  @ApiPropertyOptional({
    description: 'List of places visited during the trip',
    type: [String],
    example: ['Hoi An Ancient Town', 'My Khe Beach', 'Marble Mountains'],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  placesVisited: string[];

  @ApiPropertyOptional({
    description: 'Tags associated with the trip',
    type: [String],
    example: ['beach', 'culture', 'food', 'adventure'],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Homestay information',
    example: 'Beachfront Villa Resort',
  })
  @IsOptional()
  @IsString()
  homestay?: string;

  @ApiPropertyOptional({
    description: 'List of trip participants',
    type: [String],
    example: ['John Doe', 'Jane Smith'],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  participants?: string[];

  @ApiPropertyOptional({
    description: 'Privacy setting for the trip',
    enum: ['PUBLIC', 'PRIVATE', 'FRIENDS_ONLY'],
    example: 'PUBLIC',
  })
  @IsOptional()
  privacy?: string;
}
