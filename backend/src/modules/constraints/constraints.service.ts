import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database';
import { scenarioPresets, type ScenarioPreset } from './scenario-presets';
import { CreateScenarioDto, UpdateScenarioDto } from './dto';
import type { ScenarioType } from '@prisma/client';

@Injectable()
export class ConstraintsService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Get all built-in scenario presets
   */
  getPresets(): ScenarioPreset[] {
    return scenarioPresets;
  }

  /**
   * Get a specific preset by type
   */
  getPreset(type: string): ScenarioPreset | undefined {
    return scenarioPresets.find((p) => p.type === type);
  }

  /**
   * Create a custom scenario
   */
  async createScenario(dto: CreateScenarioDto) {
    return this.prisma.scenario.create({
      data: {
        type: dto.type as ScenarioType,
        name: dto.name,
        constraints: dto.constraints as unknown as object,
      },
    });
  }

  /**
   * Get all saved scenarios (custom scenarios from DB)
   */
  async findAllScenarios(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.scenario.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.scenario.count(),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a scenario by ID
   */
  async findScenario(id: string) {
    const scenario = await this.prisma.scenario.findUnique({
      where: { id },
    });

    if (!scenario) {
      throw new NotFoundException(`Scenario with ID ${id} not found`);
    }

    return scenario;
  }

  /**
   * Update a scenario
   */
  async updateScenario(id: string, dto: UpdateScenarioDto) {
    const existing = await this.findScenario(id);

    return this.prisma.scenario.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.constraints && {
          constraints: dto.constraints as unknown as object,
        }),
      },
    });
  }

  /**
   * Delete a scenario
   */
  async deleteScenario(id: string) {
    await this.findScenario(id);

    // Delete related evaluations first
    await this.prisma.evaluationRun.deleteMany({
      where: { scenarioId: id },
    });

    return this.prisma.scenario.delete({
      where: { id },
    });
  }

  /**
   * Get default constraints
   */
  getDefaultConstraints() {
    const normalPreset = this.getPreset('normal');
    return normalPreset?.constraints || {
      avgRPS: 1000,
      peakRPS: 2000,
      readWriteRatio: 80,
      payloadSize: 10,
      slaLatency: 200,
      retryAttempts: 3,
      rateLimitRPS: 10000,
      consumerLagTolerance: 5000,
    };
  }
}
