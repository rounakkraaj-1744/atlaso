import { IsString, IsNotEmpty, IsArray, IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateComponentDefinitionDto {
    @IsString()
    @IsNotEmpty()
    key: string;

    @IsString()
    @IsNotEmpty()
    displayName: string;

    @IsString()
    @IsNotEmpty()
    category: string;

    @IsString()
    @IsNotEmpty()
    vendor: string;

    @IsArray()
    @IsString({ each: true })
    supportedFlows: string[];

    @IsString()
    @IsNotEmpty()
    scalingModel: string;

    @IsString()
    @IsNotEmpty()
    failureMode: string;

    @IsOptional()
    assumptions?: Record<string, unknown>;

    @IsString()
    @IsOptional()
    iconPath?: string;

    @IsString()
    @IsOptional()
    documentation?: string;

    @IsBoolean()
    isManaged: boolean;

    @IsBoolean()
    @IsOptional()
    isExperimental?: boolean;

    @IsNumber()
    @Min(0)
    defaultThroughput: number;

    @IsNumber()
    @Min(0)
    defaultLatency: number;

    @IsString()
    @IsOptional()
    description?: string;
}