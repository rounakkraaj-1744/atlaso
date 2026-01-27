
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database';
import type { CanvasNode, Connection } from '../../shared/types';

@Injectable()
export class ArchitectureRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string) {
        const architecture = await this.prisma.architecture.findUnique({
            where: { id },
        });

        if (!architecture)
            throw new NotFoundException(`Architecture with ID ${id} not found`);

        return architecture;
    }

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

    async create(data: { name: string; description: string; nodes: CanvasNode[]; edges: Connection[]; version?: number; parentId?: string | null; }) {
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

    async update( id: string, data: Partial<{ name: string; description: string; nodes: CanvasNode[]; edges: Connection[]; }> ) {
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

    async delete(id: string) {
        await this.findById(id);

        await this.prisma.evaluationRun.deleteMany({
            where: {
                architectureId: id
            }
        });

        return this.prisma.architecture.delete({
            where: { id },
        });
    }

    async exists(id: string): Promise<boolean> {
        const count = await this.prisma.architecture.count({
            where: { id },
        });
        return count > 0;
    }

    async findChildren(parentId: string) {
        return this.prisma.architecture.findMany({
            where: { parentId },
            orderBy: { version: 'asc' },
        });
    }
}