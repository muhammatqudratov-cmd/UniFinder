import { Injectable } from '@nestjs/common';

@Injectable()
export class UnifinderBatchService {
  getHello(): string {
    return 'UNI-FINDER Batch is running!';
  }
}
