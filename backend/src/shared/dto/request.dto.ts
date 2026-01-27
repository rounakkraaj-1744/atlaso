/**
 * Common Request DTOs
 */
import { IsInt, IsOptional, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}

export class FilterDto extends PaginationDto {
    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    vendor?: string;

    @IsOptional()
    @IsString()
    search?: string;
}
