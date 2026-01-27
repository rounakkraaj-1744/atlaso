import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { ArchitectureService } from './architecture.service';
import { CreateArchitectureDto } from './dto/create-architecture.dto';
import { UpdateArchitectureDto } from './dto/update-architecture.dto';
import { createSuccessResponse } from '../../shared/dto';
@Controller('architecture')
export class ArchitectureController {
  constructor(private readonly architectureService: ArchitectureService) { }

  @Post()
  async create(@Body() createArchitectureDto: CreateArchitectureDto) {
    const architecture =
      await this.architectureService.create(createArchitectureDto);
    return createSuccessResponse(architecture, 'Architecture created successfully');
  }

  @Get()
  async findAll( @Query('page') page?: string, @Query('limit') limit?: string ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const result = await this.architectureService.findAll(pageNum, limitNum);
    return {
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const architecture = await this.architectureService.findOne(id);
    return createSuccessResponse(architecture);
  }

  @Patch(':id')
  async update( @Param('id', ParseUUIDPipe) id: string, @Body() updateArchitectureDto: UpdateArchitectureDto ) {
    const architecture = await this.architectureService.update(
      id,
      updateArchitectureDto,
    );
    return createSuccessResponse(architecture, 'Architecture updated successfully');
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.architectureService.remove(id);
    return createSuccessResponse(null, 'Architecture deleted successfully');
  }

  @Post(':id/fork')
  async fork( @Param('id', ParseUUIDPipe) id: string, @Body('name') newName?: string ) {
    const forked = await this.architectureService.fork(id, newName);
    return createSuccessResponse(forked, 'Architecture forked successfully');
  }

  @Get(':id/versions')
  async getVersions(@Param('id', ParseUUIDPipe) id: string) {
    const versions = await this.architectureService.getVersionHistory(id);
    return createSuccessResponse(versions);
  }
}