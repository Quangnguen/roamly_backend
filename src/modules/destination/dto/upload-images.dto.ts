import { ApiProperty } from '@nestjs/swagger';

export class UploadImagesDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Select multiple images from gallery or camera (max 10 files)',
    maxItems: 10,
  })
  images: Express.Multer.File[];
}
