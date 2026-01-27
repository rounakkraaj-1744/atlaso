import { Controller, Get, Param, Query } from '@nestjs/common';
import { RegistryService } from './registry.service';
import { createSuccessResponse } from '../../shared/dto';
@Controller('registry')
export class RegistryController {
  constructor(private readonly registryService: RegistryService) { }

  @Get('components')
  async findAll( @Query('category') category?: string, @Query('vendor') vendor?: string, @Query('page') page?: string, @Query('limit') limit?: string ) {
    const result = await this.registryService.findAll({
      category,
      vendor,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
    return {
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('components/:key')
  async findByKey(@Param('key') key: string) {
    const component = await this.registryService.findByKey(key);
    return createSuccessResponse(component);
  }

  @Get('categories')
  getCategories() {
    const categories = this.registryService.getCategories();
    return createSuccessResponse(categories);
  }

  @Get('seed')
  async seed() {
    await this.registryService.seedComponents();
    return createSuccessResponse(null, 'Components seeded successfully');
  }
}