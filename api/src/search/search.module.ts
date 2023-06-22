import {Module} from '@nestjs/common';
import {SearchController} from './controllers/search.controller';
import {SearchService} from './services/search.service';
import {PrismaService} from '../shared/services/prisma.service';
import {RecentTagsController} from './controllers/recent_tags.controller';
import {TopTagsController} from './controllers/top_tags.controller';
import {RecentTagsService} from './services/tags_recent.service';
import {TopTagsService} from './services/tags_top.service';

@Module({
  controllers: [SearchController, RecentTagsController, TopTagsController],
  providers: [PrismaService, SearchService, RecentTagsService, TopTagsService],
})
export class SearchModule {}
