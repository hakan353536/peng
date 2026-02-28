import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'public'));

  const port = process.env.PORT || 3005;
  await app.listen(port, '0.0.0.0');

  console.log(`Tracking Service running on http://0.0.0.0:${port}`);
  console.log(`Viewer: http://localhost:${port}/viewer.html`);
}
bootstrap();
