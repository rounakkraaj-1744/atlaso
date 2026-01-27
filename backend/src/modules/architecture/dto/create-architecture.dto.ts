import {
    IsString,
    IsNotEmpty,
    IsArray,
    IsOptional,
    ValidateNested,
    IsNumber,
    IsEnum,
    Min,
    IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

// Node Position DTO
class PositionDto {
    @IsNumber()
    x: number;

    @IsNumber()
    y: number;
}

// Node Config DTO
class NodeConfigDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @Min(0)
    throughput: number;

    @IsNumber()
    @Min(0)
    latency: number;

    @IsNumber()
    @Min(1)
    scalingFactor: number;

    @IsString()
    failureBehavior: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

// Canvas Node DTO
class CanvasNodeDto {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsString()
    @IsNotEmpty()
    type: string;

    @ValidateNested()
    @Type(() => PositionDto)
    position: PositionDto;

    @ValidateNested()
    @Type(() => NodeConfigDto)
    config: NodeConfigDto;

    @IsString()
    @IsOptional()
    status?: string;
}

// Connection DTO
class ConnectionDto {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsString()
    @IsNotEmpty()
    sourceId: string;

    @IsString()
    @IsNotEmpty()
    targetId: string;

    @IsEnum(['sync', 'async'])
    type: 'sync' | 'async';

    @IsBoolean()
    @IsOptional()
    hasRetry?: boolean;

    @IsBoolean()
    @IsOptional()
    hasBuffer?: boolean;
}

export class CreateArchitectureDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CanvasNodeDto)
    nodes: CanvasNodeDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ConnectionDto)
    edges: ConnectionDto[];

    @IsString()
    @IsOptional()
    parentId?: string;
}
