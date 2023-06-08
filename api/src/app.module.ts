import {MiddlewareConsumer, Module} from '@nestjs/common';
import {PrismaService, LinksService, SearchService, TagsService} from './services';
import {LinksController, SearchController, SitemapController, TagsController} from './controllers';
import {ApiKeyMiddleware} from './middleware/api_key.middleware';

@Module({
  imports: [],
  controllers: [LinksController, SearchController, SitemapController, TagsController],
  providers: [PrismaService, LinksService, SearchService, TagsService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiKeyMiddleware).forRoutes('*');
  }
}
