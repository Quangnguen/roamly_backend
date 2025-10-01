import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMessageDto {
  @ApiPropertyOptional({
    description: 'Updated content of the message',
    example: 'Updated message content',
  })
  @IsString()
  @IsOptional()
  content?: string;
}
