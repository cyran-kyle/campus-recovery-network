import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));
  
  app.enableCors({
    origin: true, // Dynamically mirror origin, ideal for ngrok tunnels
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
