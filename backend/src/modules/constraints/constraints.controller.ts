import { Controller } from '@nestjs/common';
import { ConstraintsService } from './constraints.service';

@Controller('constraints')
export class ConstraintsController {
    constructor(private readonly constraintsService: ConstraintsService) {}
}