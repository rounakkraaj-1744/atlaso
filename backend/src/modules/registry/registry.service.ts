import { Injectable } from '@nestjs/common';
import { CreateRegistryDto } from './dto/create-registry.dto';
import { UpdateRegistryDto } from './dto/update-registry.dto';

@Injectable()
export class RegistryService {
  create(createRegistryDto: CreateRegistryDto) {
    return 'This action adds a new registry';
  }

  findAll() {
    return `This action returns all registry`;
  }

  findOne(id: number) {
    return `This action returns a #${id} registry`;
  }

  update(id: number, updateRegistryDto: UpdateRegistryDto) {
    return `This action updates a #${id} registry`;
  }

  remove(id: number) {
    return `This action removes a #${id} registry`;
  }
}
