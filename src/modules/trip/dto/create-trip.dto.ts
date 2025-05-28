import { IsString, IsOptional, IsArray, IsBoolean, IsDateString, IsNumber, IsNotEmpty } from 'class-validator';

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

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    placesVisited: string[];

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    tags?: string[];

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

    @IsOptional()
    @IsNumber()
    rating?: number;

    // Photos sẽ được xử lý qua @UploadedFiles, không cần validate ở đây
}