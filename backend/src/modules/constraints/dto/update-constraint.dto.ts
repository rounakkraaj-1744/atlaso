import { PartialType } from '@nestjs/mapped-types';
import { CreateConstraintDto } from './create-constraint.dto';

export class UpdateConstraintDto extends PartialType(CreateConstraintDto) {}
