import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import * as hbs from 'hbs';
import * as fs from 'fs';

async function bootstrap() {
  const ENV = process.env.NODE_ENV;
  let PORT = 80;
  let httpsOptions = null;

  if (ENV === 'prod') {
    PORT = 443;
    httpsOptions = {
      ca: fs.readFileSync('/etc/letsencrypt/live/bbaguette.xyz/fullchain.pem'),
      key: fs.readFileSync('/etc/letsencrypt/live/bbaguette.xyz/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/bbaguette.xyz/cert.pem'),
    };
  }
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    httpsOptions,
  });

  hbs.registerPartials(join(__dirname, '..', 'views/partials'));
  app.useStaticAssets(join(__dirname, '..', 'views'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));

  app.setViewEngine('hbs');

  console.log('run server on', PORT);
  await app.listen(PORT);
}
bootstrap();
