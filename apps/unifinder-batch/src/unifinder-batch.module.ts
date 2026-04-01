import { Module } from '@nestjs/common';
import { UnifinderBatchController } from './unifinder-batch.controller';
import { UnifinderBatchService } from './unifinder-batch.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [UnifinderBatchController],
  providers: [UnifinderBatchService],
})
export class UnifinderBatchModule {}
