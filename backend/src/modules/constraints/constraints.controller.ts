import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { ConstraintsService } from './constraints.service';
import { CreateScenarioDto, UpdateScenarioDto } from './dto';
import { createSuccessResponse } from '../../shared/dto';

@Controller('scenarios')
export class ConstraintsController {
    constructor(private readonly constraintsService: ConstraintsService) { }

    @Get('presets')
    getPresets() {
        const presets = this.constraintsService.getPresets();
        return createSuccessResponse(presets);
    }

    @Get('presets/:type')
    getPreset(@Param('type') type: string) {
        const preset = this.constraintsService.getPreset(type);
        if (!preset)
            return createSuccessResponse(null, 'Preset not found');

        return createSuccessResponse(preset);
    }

    @Get('defaults')
    getDefaults() {
        const defaults = this.constraintsService.getDefaultConstraints();
        return createSuccessResponse(defaults);
    }

    @Post()
    async create(@Body() dto: CreateScenarioDto) {
        const scenario = await this.constraintsService.createScenario(dto);
        return createSuccessResponse(scenario, 'Scenario created successfully');
    }

    @Get()
    async findAll( @Query('page') page?: string, @Query('limit') limit?: string ) {
        const result = await this.constraintsService.findAllScenarios(
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20,
        );
        return {
            success: true,
            ...result,
            timestamp: new Date().toISOString(),
        };
    }

    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        const scenario = await this.constraintsService.findScenario(id);
        return createSuccessResponse(scenario);
    }

    @Patch(':id')
    async update( @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateScenarioDto ) {
        const scenario = await this.constraintsService.updateScenario(id, dto);
        return createSuccessResponse(scenario, 'Scenario updated successfully');
    }

    @Delete(':id')
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        await this.constraintsService.deleteScenario(id);
        return createSuccessResponse(null, 'Scenario deleted successfully');
    }
}