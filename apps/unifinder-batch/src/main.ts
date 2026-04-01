import { NestFactory } from '@nestjs/core';
import { UnifinderBatchModule } from './unifinder-batch.module';

async function bootstrap() {
  const app = await NestFactory.create(UnifinderBatchModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
