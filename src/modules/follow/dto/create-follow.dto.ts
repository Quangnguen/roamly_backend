import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFollowDto {
  @ApiProperty({
    description: 'ID of the user to follow',
    example: 'uuid-of-user-to-follow',
    format: 'uuid',
    required: true,
  })
  @IsUUID()
  followingId: string;
}
