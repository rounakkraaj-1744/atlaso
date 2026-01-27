import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsEnum,
    Min,
    Max,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SystemConstraintsDto {
    @IsNumber()
    @Min(1)
    avgRPS: number;

    @IsNumber()
    @Min(1)
    peakRPS: number;

    @IsNumber()
    @Min(0)
    @Max(100)
    readWriteRatio: number;

    @IsNumber()
    @Min(1)
    payloadSize: number;

    @IsNumber()
    @Min(1)
    slaLatency: number;

    @IsNumber()
    @Min(0)
    @Max(20)
    retryAttempts: number;

    @IsNumber()
    @Min(1)
    rateLimitRPS: number;

    @IsNumber()
    @Min(1)
    consumerLagTolerance: number;
}

export class CreateScenarioDto {
    @IsEnum(['NORMAL', 'FLASH_SALE', 'BLACK_FRIDAY', 'INCIDENT', 'CUSTOM'])
    type: 'NORMAL' | 'FLASH_SALE' | 'BLACK_FRIDAY' | 'INCIDENT' | 'CUSTOM';

    @IsString()
    @IsNotEmpty()
    name: string;

    @ValidateNested()
    @Type(() => SystemConstraintsDto)
    constraints: SystemConstraintsDto;
}

export class UpdateScenarioDto {
    @IsString()
    @IsOptional()
    name?: string;

    @ValidateNested()
    @Type(() => SystemConstraintsDto)
    @IsOptional()
    constraints?: SystemConstraintsDto;
}
