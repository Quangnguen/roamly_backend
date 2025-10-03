import { IsOptional, IsString, IsArray } from 'class-validator';

export class CreatePostDto {
  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  taggedDestinations?: string[]; // Array of destination IDs
}
