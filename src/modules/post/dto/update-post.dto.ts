import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrl?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removedImages?: string[];
}
