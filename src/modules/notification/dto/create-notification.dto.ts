// dto/create-notification.dto.ts
import { IsUUID, IsOptional } from 'class-validator';

export class CreateNotificationDto {
  @IsUUID()
  senderId: string;

  @IsUUID()
  recipientId: string;

  @IsOptional()
  @IsUUID()
  postId?: string;
}
