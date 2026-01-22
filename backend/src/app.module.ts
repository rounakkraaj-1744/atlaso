import { Module } from '@nestjs/common';
import { DatabaseModule } from './shared/database';
import { HealthController } from './health.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}