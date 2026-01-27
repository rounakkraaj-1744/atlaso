import { PartialType } from '@nestjs/mapped-types';
import { CreateComponentDefinitionDto } from './create-registry.dto';

export class UpdateRegistryDto extends PartialType(CreateComponentDefinitionDto) { }
