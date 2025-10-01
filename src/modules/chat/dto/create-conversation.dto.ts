import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({
    description: 'Name of the conversation',
    example: 'Travel Planning Group',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'List of participant user IDs',
    type: [String],
    example: ['uuid-user-1', 'uuid-user-2'],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  participants?: string[];
}
