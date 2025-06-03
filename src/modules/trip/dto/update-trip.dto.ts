import { IsString, IsOptional, IsArray, IsDateString, IsNotEmpty, IsObject } from 'class-validator';


export class UpdateTripDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;

    @IsObject()
    @IsOptional()
    @IsNotEmpty()
    cost: object; // ví dụ: { meals: 100, transport: 200, total: 300 }

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    placesVisited: string[];

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsString()
    homestay?: string;

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    participants?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    imageUrl?: string[]; // URL của ảnh đại diện chuyến đi
    // Thay đổi thành enum privacy

    @IsOptional()
    privacy?: string;
}