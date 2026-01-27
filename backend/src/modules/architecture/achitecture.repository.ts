/**
 * Architecture Repository - Data access layer for architectures
 * Note: This is a thin abstraction over Prisma for potential future caching
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database';
import type { CanvasNode, Connection } from '../../shared/types';

@Injectable()
export class ArchitectureRepository {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Find architecture by ID
     */
    async findById(id: string) {
        const architecture = await this.prisma.architecture.findUnique({
            where: { id },
        });

        if (!architecture) {
            throw new NotFoundException(`Architecture with ID ${id} not found`);
        }

        return architecture;
    }

    /**
     * Find architecture with evaluations
     */
    async findByIdWithEvaluations(id: string) {
        const architecture = await this.prisma.architecture.findUnique({
            where: { id },
            include: {
                evaluations: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });

        if (!architecture) {
            throw new NotFoundException(`Architecture with ID ${id} not found`);
        }

        return architecture;
    }

    /**
     * Find all architectures with pagination
     */
    async findAll(page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.architecture.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    version: true,
                    parentId: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            this.prisma.architecture.count(),
        ]);

        return { data, total };
    }

    /**
     * Create a new architecture
     */
    async create(data: {
        name: string;
        description: string;
        nodes: CanvasNode[];
        edges: Connection[];
        version?: number;
        parentId?: string | null;
    }) {
        return this.prisma.architecture.create({
            data: {
                name: data.name,
                description: data.description,
                nodes: data.nodes as unknown as object,
                edges: data.edges as unknown as object,
                version: data.version || 1,
                parentId: data.parentId || null,
            },
        });
    }

    /**
     * Update an architecture
     */
    async update(
        id: string,
        data: Partial<{
            name: string;
            description: string;
            nodes: CanvasNode[];
            edges: Connection[];
        }>,
    ) {
        await this.findById(id);

        return this.prisma.architecture.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.nodes && { nodes: data.nodes as unknown as object }),
                ...(data.edges && { edges: data.edges as unknown as object }),
            },
        });
    }

    /**
     * Delete an architecture and related data
     */
    async delete(id: string) {
        await this.findById(id);

        // Delete related evaluations first
        await this.prisma.evaluationRun.deleteMany({
            where: { architectureId: id },
        });

        return this.prisma.architecture.delete({
            where: { id },
        });
    }

    /**
     * Check if architecture exists
     */
    async exists(id: string): Promise<boolean> {
        const count = await this.prisma.architecture.count({
            where: { id },
        });
        return count > 0;
    }

    /**
     * Find children (forked versions)
     */
    async findChildren(parentId: string) {
        return this.prisma.architecture.findMany({
            where: { parentId },
            orderBy: { version: 'asc' },
        });
    }
}
