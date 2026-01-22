import { Module } from '@nestjs/common';
import { ConstraintsService } from './constraints.service';
import { ConstraintsController } from './constraints.controller';

@Module({
  controllers: [ConstraintsController],
  providers: [ConstraintsService],
})
export class ConstraintsModule {}
