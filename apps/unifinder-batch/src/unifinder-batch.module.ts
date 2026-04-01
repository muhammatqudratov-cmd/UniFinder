import { Module } from '@nestjs/common';
import { UnifinderBatchController } from './unifinder-batch.controller';
import { UnifinderBatchService } from './unifinder-batch.service';

@Module({
  imports: [],
  controllers: [UnifinderBatchController],
  providers: [UnifinderBatchService],
})
export class UnifinderBatchModule {}
