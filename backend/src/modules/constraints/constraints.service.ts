import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database';
import { scenarioPresets, type ScenarioPreset } from './scenario-presets';
import { CreateScenarioDto, UpdateScenarioDto } from './dto';
import type { ScenarioType } from '@prisma/client';

@Injectable()
export class ConstraintsService {
  constructor(private readonly prisma: PrismaService) { }

  getPresets(): ScenarioPreset[] {
    return scenarioPresets;
  }

  getPreset(type: string): ScenarioPreset | undefined {
    return scenarioPresets.find((p) => p.type === type);
  }

  async createScenario(dto: CreateScenarioDto) {
    return this.prisma.scenario.create({
      data: {
        type: dto.type as ScenarioType,
        name: dto.name,
        constraints: dto.constraints as unknown as object,
      },
    });
  }

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

  async findScenario(id: string) {
    const scenario = await this.prisma.scenario.findUnique({
      where: { id },
    });

    if (!scenario)
      throw new NotFoundException(`Scenario with ID ${id} not found`);

    return scenario;
  }

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

  async deleteScenario(id: string) {
    await this.findScenario(id);

    await this.prisma.evaluationRun.deleteMany({
      where: { scenarioId: id },
    });

    return this.prisma.scenario.delete({
      where: { id },
    });
  }

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