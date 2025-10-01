import { ApiProperty } from '@nestjs/swagger';

export class UploadTripImagesDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Multiple trip/memory images from gallery or camera',
    required: false,
  })
  images?: Express.Multer.File[];
}
