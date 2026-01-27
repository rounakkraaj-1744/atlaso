import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database';
import { CreateArchitectureDto } from './dto/create-architecture.dto';
import { UpdateArchitectureDto } from './dto/update-architecture.dto';
import type { CanvasNode, Connection } from '../../shared/types';

@Injectable()
export class ArchitectureService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createArchitectureDto: CreateArchitectureDto) {
    const { name, description, nodes, edges, parentId } = createArchitectureDto;

    let version = 1;
    if (parentId) {
      const parent = await this.prisma.architecture.findUnique({
        where: { id: parentId },
      });
      if (parent)
        version = parent.version + 1;
    }

    return this.prisma.architecture.create({
      data: {
        name,
        description: description || '',
        version,
        parentId: parentId || null,
        nodes: nodes as unknown as object,
        edges: edges as unknown as object,
      },
    });
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

  async findOne(id: string) {
    const architecture = await this.prisma.architecture.findUnique({
      where: { id },
      include: {
        evaluations: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!architecture)
      throw new NotFoundException(`Architecture with ID ${id} not found`);

    return architecture;
  }

  async update(id: string, updateArchitectureDto: UpdateArchitectureDto) {
    const existing = await this.prisma.architecture.findUnique({
      where: { id },
    });

    if (!existing) 
      throw new NotFoundException(`Architecture with ID ${id} not found`);

    const { name, description, nodes, edges } = updateArchitectureDto;

    return this.prisma.architecture.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(nodes && { nodes: nodes as unknown as object }),
        ...(edges && { edges: edges as unknown as object }),
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.architecture.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Architecture with ID ${id} not found`);
    }

    // Delete related evaluations first
    await this.prisma.evaluationRun.deleteMany({
      where: { architectureId: id },
    });

    return this.prisma.architecture.delete({
      where: { id },
    });
  }

  async fork(id: string, newName?: string) {
    const parent = await this.findOne(id);

    return this.create({
      name: newName || `${parent.name} (Fork)`,
      description: parent.description,
      nodes: parent.nodes as unknown as CanvasNode[],
      edges: parent.edges as unknown as Connection[],
      parentId: id,
    });
  }

  async getVersionHistory(id: string) {
    const architecture = await this.findOne(id);
    let rootId = id;
    let current: { parentId: string | null } | null = architecture;

    while (current?.parentId) {
      rootId = current.parentId;
      const next = await this.prisma.architecture.findUnique({
        where: { id: rootId },
      });
      if (!next) break;
      current = next;
    }

    const allVersions = await this.prisma.architecture.findMany({
      where: {
        OR: [{ id: rootId }, { parentId: rootId }],
      },
      orderBy: { version: 'asc' },
      select: {
        id: true,
        name: true,
        version: true,
        parentId: true,
        createdAt: true,
      },
    });

    const childrenVersions = await this.prisma.architecture.findMany({
      where: {
        parentId: { in: allVersions.map((v) => v.id) },
      },
      orderBy: { version: 'asc' },
      select: {
        id: true,
        name: true,
        version: true,
        parentId: true,
        createdAt: true,
      },
    });

    return [...allVersions, ...childrenVersions].sort(
      (a, b) => a.version - b.version,
    );
  }
}