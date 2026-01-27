import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../shared/database';
import { componentSeeds, categoryNames, type SeedComponent } from './seed';
import {
  ComponentCategory,
  Vendor,
  DataFlowType,
  ScalingModel,
  FailureMode,
} from '@prisma/client';

@Injectable()
export class RegistryService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Seed components on module initialization if database is empty
   */
  async onModuleInit() {
    const count = await this.prisma.componentDefinition.count();
    if (count === 0) {
      console.log('Seeding component definitions...');
      await this.seedComponents();
      console.log(`Seeded ${componentSeeds.length} component definitions`);
    }
  }

  /**
   * Seed all component definitions
   */
  async seedComponents() {
    for (const component of componentSeeds) {
      await this.prisma.componentDefinition.upsert({
        where: { key: component.key },
        update: this.mapToDbComponent(component),
        create: this.mapToDbComponent(component),
      });
    }
  }

  /**
   * Map seed component to Prisma model
   */
  private mapToDbComponent(component: SeedComponent) {
    return {
      key: component.key,
      displayName: component.displayName,
      category: component.category as ComponentCategory,
      vendor: component.vendor as Vendor,
      supportedFlows: component.supportedFlows as DataFlowType[],
      scalingModel: component.scalingModel as ScalingModel,
      failureMode: component.failureMode as FailureMode,
      assumptions: {
        ...component.assumptions,
        defaultThroughput: component.defaultThroughput,
        defaultLatency: component.defaultLatency,
        description: component.description,
      },
      iconPath: component.iconPath,
      documentation: component.documentation,
      isManaged: component.isManaged,
      isExperimental: component.isExperimental,
    };
  }

  /**
   * Get all components with optional filtering
   */
  async findAll(options?: {
    category?: string;
    vendor?: string;
    page?: number;
    limit?: number;
  }) {
    const { category, vendor, page = 1, limit = 50 } = options || {};
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (category) {
      where.category = category.toUpperCase();
    }
    if (vendor) {
      where.vendor = vendor.toUpperCase();
    }

    const [data, total] = await Promise.all([
      this.prisma.componentDefinition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { displayName: 'asc' },
      }),
      this.prisma.componentDefinition.count({ where }),
    ]);

    // Map to frontend-compatible format
    const mappedData = data.map((c) => this.mapToFrontendComponent(c));

    return {
      data: mappedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get component by key
   */
  async findByKey(key: string) {
    const component = await this.prisma.componentDefinition.findUnique({
      where: { key },
    });

    if (!component) {
      throw new NotFoundException(`Component with key ${key} not found`);
    }

    return this.mapToFrontendComponent(component);
  }

  /**
   * Get available categories
   */
  getCategories() {
    return Object.entries(categoryNames).map(([key, name]) => ({
      key,
      name,
    }));
  }

  /**
   * Map DB component to frontend-compatible format
   */
  private mapToFrontendComponent(component: {
    id: string;
    key: string;
    displayName: string;
    category: ComponentCategory;
    vendor: Vendor;
    supportedFlows: DataFlowType[];
    scalingModel: ScalingModel;
    failureMode: FailureMode;
    assumptions: unknown;
    iconPath: string;
    documentation: string | null;
    isManaged: boolean;
    isExperimental: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const assumptions = component.assumptions as Record<string, unknown>;
    return {
      type: component.key,
      name: component.displayName,
      category: component.category.toLowerCase(),
      vendor: component.vendor.toLowerCase(),
      dataPatterns: component.supportedFlows.map((f) => f.toLowerCase()),
      scalingModel: component.scalingModel.toLowerCase(),
      failureMode: component.failureMode.toLowerCase(),
      defaultThroughput: (assumptions?.defaultThroughput as number) || 1000,
      defaultLatency: (assumptions?.defaultLatency as number) || 10,
      description: (assumptions?.description as string) || '',
      iconPath: component.iconPath,
      isManaged: component.isManaged,
      isExperimental: component.isExperimental,
    };
  }
}
