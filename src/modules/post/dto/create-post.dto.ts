import { IsOptional, IsString, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreatePostDto {
  @IsOptional()
  @IsString()
  caption?: string;
}
