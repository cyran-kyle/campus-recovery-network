import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

let serverHandler: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));
  
  app.enableCors({
    origin: true,
    credentials: true,
  });

  if (process.env.VERCEL) {
    await app.init();
    return app.getHttpAdapter().getInstance();
  } else {
    await app.listen(process.env.PORT ?? 3000);
  }
}

// Local development startup
if (!process.env.VERCEL) {
  bootstrap();
}

// Vercel serverless entrypoint handler
export default async (req: any, res: any) => {
  if (!serverHandler) {
    serverHandler = await bootstrap();
  }
  return serverHandler(req, res);
};
