import {Module} from '@nestjs/common';
import {CrawlController} from './controllers/crawl.controller';
import {CrawlService} from './services/crawl.service';
import {PrismaService} from '../shared/services/prisma.service';

@Module({
  controllers: [CrawlController],
  providers: [PrismaService, CrawlService],
})
export class CrawlModule {}
