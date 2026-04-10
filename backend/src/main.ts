import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: true, // Allow dynamic origin for LAN testing
    credentials: true,
  });

  // WebSocket adapter (Socket.IO)
  app.useWebSocketAdapter(new IoAdapter(app));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Ensure uploads directory exists
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }

  const port = process.env.PORT || 3001;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  console.log(`Security System API running on http://${host}:${port}`);
  console.log(`API docs: http://${host}:${port}/api`);
  console.log(`💬 Chat WebSocket enabled on /chat namespace`);
}
bootstrap();
