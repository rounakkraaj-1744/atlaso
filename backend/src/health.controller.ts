import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './shared/database';

@Controller('health')
export class HealthController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    async checkHealth() {
        try {
            // Test database connection by querying a table
            await this.prisma.architecture.count();

            return {
                status: 'ok',
                database: 'connected',
                message: 'Supabase PostgreSQL connection successful',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                status: 'error',
                database: 'disconnected',
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }

    @Get('db')
    async checkDatabase() {
        try {
            const architectureCount = await this.prisma.architecture.count();
            const componentCount = await this.prisma.componentDefinition.count();
            const scenarioCount = await this.prisma.scenario.count();

            return {
                status: 'ok',
                database: 'Supabase PostgreSQL',
                tables: {
                    architectures: architectureCount,
                    components: componentCount,
                    scenarios: scenarioCount,
                },
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                status: 'error',
                message: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }
}