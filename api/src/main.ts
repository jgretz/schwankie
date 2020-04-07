import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {configureEnvironment} from './services';

async function bootstrap() {
  if (process.env.NODE_ENV !== 'PRODUCTION') {
    configureEnvironment();
  }

  const app = await NestFactory.create(AppModule);

  if (process.env.NODE_ENV !== 'PRODUCTION') {
    app.enableCors();
  }

  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
