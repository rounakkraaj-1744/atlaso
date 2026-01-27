import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.setGlobalPrefix('api', {
    exclude: ['health', 'health/db'],
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Atlaso API running on http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`API base: http://localhost:${port}/api`);
}
bootstrap();