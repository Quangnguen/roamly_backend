import { ApiProperty } from '@nestjs/swagger';

export class UploadHomestayImagesDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description:
      'Multiple homestay images from gallery or camera (max 10 files)',
    maxItems: 10,
  })
  images: Express.Multer.File[];
}
