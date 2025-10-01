import { ApiProperty } from '@nestjs/swagger';

export class UploadAddressImagesDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description:
      'Multiple address/location images from gallery or camera (max 10 files)',
    maxItems: 10,
  })
  images: Express.Multer.File[];
}
