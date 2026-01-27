import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ComparisonService } from './comparison.service';
import { createSuccessResponse } from '../../shared/dto';

class CompareDto {
    baseId: string;
    modifiedId: string;
}

@Controller('comparisons')
export class ComparisonController {
    constructor(private readonly comparisonService: ComparisonService) { }

    @Post()
    async compare(@Body() dto: CompareDto) {
        const result = await this.comparisonService.compare(dto.baseId, dto.modifiedId);
        return createSuccessResponse(result, 'Comparison completed');
    }

    @Get()
    async findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const result = await this.comparisonService.findAll(
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 10,
        );
        return {
            success: true,
            ...result,
            timestamp: new Date().toISOString(),
        };
    }

    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        const comparison = await this.comparisonService.findOne(id);
        return createSuccessResponse(comparison);
    }
}
