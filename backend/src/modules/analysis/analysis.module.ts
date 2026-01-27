import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { EvaluationModule } from '../evaluation/evaluation.module';

@Module({
    imports: [EvaluationModule],
    providers: [AnalysisService],
    exports: [AnalysisService],
})
export class AnalysisModule { }
