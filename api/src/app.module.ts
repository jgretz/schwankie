/* eslint-disable import/prefer-default-export */
import {Module, CacheModule, CacheInterceptor} from '@nestjs/common';
import {CqrsModule} from '@nestjs/cqrs';
import {ServeStaticModule} from '@nestjs/serve-static';
import {APP_INTERCEPTOR} from '@nestjs/core';

import {resolveClientPath} from './services';

import {AppController, AppService} from './features/main';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: resolveClientPath(),
      renderPath: '/*',
    }),
    CqrsModule,
    CacheModule.register(),
  ],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
  controllers: [AppController],
})
export class AppModule {}
