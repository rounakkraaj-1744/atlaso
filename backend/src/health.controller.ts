import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './shared/database';

@Controller('health')
export class HealthController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    async checkHealth() {
        try {
            await this.prisma.$queryRaw`SELECT 1`;

            return {
                status: 'ok',
                database: 'connected',
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
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
    }
}