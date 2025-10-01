import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReactionDto {
  @ApiProperty({
    description: 'ID of the message to react to',
    example: 'uuid-of-message',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @ApiProperty({
    description: 'Emoji reaction',
    example: '👍',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  emoji: string;
}
