import { Controller, Get } from '@nestjs/common';
import { UnifinderBatchService } from './unifinder-batch.service';

@Controller()
export class UnifinderBatchController {
  constructor(private readonly unifinderBatchService: UnifinderBatchService) {}

  @Get()
  getHello(): string {
    return this.unifinderBatchService.getHello();
  }
}
