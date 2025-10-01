import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFollowStatusDto {
  @ApiProperty({
    description: 'Status of the follow request',
    enum: ['accepted', 'declined', 'blocked'],
    example: 'accepted',
    required: true,
  })
  @IsIn(['accepted', 'declined', 'blocked'])
  followStatus: string;
}
