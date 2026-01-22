import { Injectable } from '@nestjs/common';
import { CreateConstraintDto } from './dto/create-constraint.dto';
import { UpdateConstraintDto } from './dto/update-constraint.dto';

@Injectable()
export class ConstraintsService {
  create(createConstraintDto: CreateConstraintDto) {
    return 'This action adds a new constraint';
  }

  findAll() {
    return `This action returns all constraints`;
  }

  findOne(id: number) {
    return `This action returns a #${id} constraint`;
  }

  update(id: number, updateConstraintDto: UpdateConstraintDto) {
    return `This action updates a #${id} constraint`;
  }

  remove(id: number) {
    return `This action removes a #${id} constraint`;
  }
}
