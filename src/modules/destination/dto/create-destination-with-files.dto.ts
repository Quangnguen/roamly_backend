import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNotEmpty,
  IsNumber,
  IsIn,
  IsArray,
} from 'class-validator';

export class CreateDestinationWithFilesDto {
  @ApiProperty({
    example: 'Hạ Long Bay',
    description: 'Tên địa điểm du lịch',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Vịnh Hạ Long là một vịnh nhỏ thuộc phần tây bắc Vịnh Bắc Bộ...',
    description: 'Mô tả chi tiết về địa điểm',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    example: 'Hạ Long, Quảng Ninh',
    description: 'Địa chỉ',
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({
    example: 'Hạ Long',
    description: 'Thành phố',
  })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description:
      'Upload destination images (supports multiple files from gallery or camera)',
    required: false,
  })
  images?: Express.Multer.File[];
}
