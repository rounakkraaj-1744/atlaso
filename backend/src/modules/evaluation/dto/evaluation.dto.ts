import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsNumber, IsEnum, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

// Node Config for inline evaluation
class NodeConfigDto {
    @IsString()
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

class PositionDto {
    @IsNumber()
    x: number;

    @IsNumber()
    y: number;
}

class CanvasNodeDto {
    @IsString()
    id: string;

    @IsString()
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

class ConnectionDto {
    @IsString()
    id: string;

    @IsString()
    sourceId: string;

    @IsString()
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

class ConstraintsDto {
    @IsNumber()
    @Min(1)
    avgRPS: number;

    @IsNumber()
    @Min(1)
    peakRPS: number;

    @IsNumber()
    @Min(0)
    readWriteRatio: number;

    @IsNumber()
    @Min(1)
    payloadSize: number;

    @IsNumber()
    @Min(1)
    slaLatency: number;

    @IsNumber()
    @Min(0)
    retryAttempts: number;

    @IsNumber()
    @Min(1)
    rateLimitRPS: number;

    @IsNumber()
    @Min(1)
    consumerLagTolerance: number;
}

export class RunEvaluationDto {
    @IsString()
    @IsNotEmpty()
    architectureId: string;

    @IsString()
    @IsNotEmpty()
    scenarioId: string;
}

export class AnalyzeInlineDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CanvasNodeDto)
    nodes: CanvasNodeDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ConnectionDto)
    edges: ConnectionDto[];

    @ValidateNested()
    @Type(() => ConstraintsDto)
    constraints: ConstraintsDto;
}
