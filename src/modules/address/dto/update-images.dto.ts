import { IsArray, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateImagesDto {
  @IsArray()
  @IsString({ each: true })
  @IsUrl({}, { each: true })
  images: string[];

  @IsOptional()
  @IsString()
  @IsUrl()
  coverImage?: string;
}
