import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RegistryService } from './registry.service';
import { CreateRegistryDto } from './dto/create-registry.dto';
import { UpdateRegistryDto } from './dto/update-registry.dto';

@Controller('registry')
export class RegistryController {
  constructor(private readonly registryService: RegistryService) {}

  @Post()
  create(@Body() createRegistryDto: CreateRegistryDto) {
    return this.registryService.create(createRegistryDto);
  }

  @Get()
  findAll() {
    return this.registryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.registryService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRegistryDto: UpdateRegistryDto) {
    return this.registryService.update(+id, updateRegistryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.registryService.remove(+id);
  }
}
