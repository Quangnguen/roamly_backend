import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Content of the message',
    example: 'Hello everyone! Ready for the trip?',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'ID of the message being replied to',
    example: 'uuid-of-parent-message',
  })
  @IsString()
  @IsOptional()
  replyToId?: string;
}
