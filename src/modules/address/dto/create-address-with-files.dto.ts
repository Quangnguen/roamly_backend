import { ApiProperty } from '@nestjs/swagger';

export class CreateAddressWithFilesDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Address images from gallery or camera (max 10 files)',
    example: 'Binary file data from mobile gallery or camera',
    required: false,
    maxItems: 10,
  })
  images?: Express.Multer.File[];
}
