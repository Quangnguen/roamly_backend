import { ApiProperty } from '@nestjs/swagger';

export class UploadPostImagesDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Multiple post images from gallery or camera (max 10 files)',
    maxItems: 10,
    required: false,
  })
  images?: Express.Multer.File[];
}
