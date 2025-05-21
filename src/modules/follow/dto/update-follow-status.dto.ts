import { IsIn } from 'class-validator';

export class UpdateFollowStatusDto {
  @IsIn(['accepted', 'declined', 'blocked'])
  followStatus: string;
}
