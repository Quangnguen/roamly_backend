import { ApiProperty } from '@nestjs/swagger';

export class UploadAvatarDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Profile picture file from gallery or camera',
  })
  file: Express.Multer.File;
}
