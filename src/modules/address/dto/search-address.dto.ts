import {
  IsOptional,
  IsString,
  IsIn,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';

export class SearchAddressDto {
  @IsOptional()
  @IsString()
  q?: string; // Tìm kiếm theo tên

  @IsOptional()
  @IsIn(['COUNTRY', 'PROVINCE', 'DISTRICT', 'WARD', 'AREA'])
  type?: string;

  @IsOptional()
  @IsString()
  parentId?: string; // Tìm theo địa chỉ cha

  @IsOptional()
  @IsNumber()
  @Min(0)
  level?: number; // Tìm theo cấp độ

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPriority?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsIn(['name', 'level', 'createdAt', 'destinationCount', 'viewCount'])
  sortBy?: string = 'name';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: string = 'asc';
}
