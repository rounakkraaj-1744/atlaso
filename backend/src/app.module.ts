import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { DatabaseModule } from './shared/database';
import { HealthController } from './health.controller';
import { ArchitectureModule } from './modules/architecture/architecture.module';
import { RegistryModule } from './modules/registry/registry.module';
import { ConstraintsModule } from './modules/constraints/constraints.module';
import { EvaluationModule } from './modules/evaluation/evaluation.module';
import { ComparisonModule } from './modules/comparison/comparison.module';
import { AnalysisModule } from './modules/analysis/analysis.module';

@Module({
  imports: [
    DatabaseModule,
    ArchitectureModule,
    RegistryModule,
    ConstraintsModule,
    EvaluationModule,
    ComparisonModule,
    AnalysisModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    },
  ],
})
export class AppModule { }