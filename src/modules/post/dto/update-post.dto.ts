import { IsOptional, IsString, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

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
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        // Trường hợp nhận chuỗi JSON trong form-data
        return JSON.parse(value);
      } catch {
        return [];
      }
    } else if (Array.isArray(value)) {
      // Trường hợp nhận mảng (ví dụ gửi nhiều phần tử với cùng key)
      return value;
    }
    // Trường hợp khác trả về mảng rỗng
    return [];
  })
  removedImages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  taggedDestinations?: string[]; // Array of destination IDs to update
}
