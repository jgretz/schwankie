import {MiddlewareConsumer, Module} from '@nestjs/common';

import {ApiKeyMiddleware} from './security/middleware/api_key.middleware';
import {CrudModule} from './crud/crud.module';
import {SearchModule} from './search/search.module';
import {CrawlModule} from './crawl/crawl.module';

@Module({
  imports: [CrudModule, SearchModule, CrawlModule],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiKeyMiddleware).forRoutes('*');
  }
}
