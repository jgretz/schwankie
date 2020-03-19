import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {enforceKeyMiddleware} from './middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (process.env.NODE_ENV !== 'PRODUCTION') {
    app.enableCors();
  }

  app.setGlobalPrefix('api');
  app.use(enforceKeyMiddleware);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
