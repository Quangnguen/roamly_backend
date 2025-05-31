import { IsString, IsOptional, IsArray, IsBoolean, IsDateString, IsNotEmpty, IsObject } from 'class-validator';

export class CreateTripDto {
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
    @IsOptional()
    @IsString({ each: true })
    sharedWith?: string[];

    @IsOptional()
    @IsBoolean()
    isPublic?: boolean;

    // Photos sẽ được xử lý qua @UploadedFiles, không cần validate ở đây
}