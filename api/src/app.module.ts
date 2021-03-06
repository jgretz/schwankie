/* eslint-disable import/prefer-default-export */
import {Module, CacheModule, CacheInterceptor} from '@nestjs/common';
import {CqrsModule} from '@nestjs/cqrs';
import {ServeStaticModule} from '@nestjs/serve-static';
import {APP_INTERCEPTOR} from '@nestjs/core';

import {resolveClientPath} from './services';

import {LinksModule} from './features/links';
import {TagsModule} from './features/tags';
import {UserModule} from './features/user';
import {SitemapController} from './features/sitemap';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: resolveClientPath(),
      renderPath: '/*',
    }),
    CacheModule.register(),

    CqrsModule,
    LinksModule,
    TagsModule,
    UserModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
  controllers: [SitemapController],
})
export class AppModule {}
