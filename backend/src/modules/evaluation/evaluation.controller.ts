import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Query,
    ParseUUIDPipe,
} from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { RunEvaluationDto, AnalyzeInlineDto } from './dto';
import { createSuccessResponse } from '../../shared/dto';
import type { CanvasNode, Connection, SystemConstraints } from '../../shared/types';

@Controller('evaluations')
export class EvaluationController {
    constructor(private readonly evaluationService: EvaluationService) { }

    @Post('run')
    async runEvaluation(@Body() dto: RunEvaluationDto) {
        const result = await this.evaluationService.runEvaluation(
            dto.architectureId,
            dto.scenarioId,
        );
        return createSuccessResponse(result, 'Evaluation completed successfully');
    }

    @Post('analyze')
    async analyzeInline(@Body() dto: AnalyzeInlineDto) {
        const result = this.evaluationService.analyzeInline(
            dto.nodes as unknown as CanvasNode[],
            dto.edges as unknown as Connection[],
            dto.constraints as unknown as SystemConstraints,
        );
        return createSuccessResponse(result);
    }

    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        const evaluation = await this.evaluationService.findOne(id);
        return createSuccessResponse(evaluation);
    }

    @Get('architecture/:id')
    async findByArchitecture(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const result = await this.evaluationService.findByArchitecture(
            id,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 10,
        );
        return {
            success: true,
            ...result,
            timestamp: new Date().toISOString(),
        };
    }

    @Delete(':id')
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        await this.evaluationService.remove(id);
        return createSuccessResponse(null, 'Evaluation deleted successfully');
    }
}
