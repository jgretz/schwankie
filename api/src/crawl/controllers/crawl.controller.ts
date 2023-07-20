import {Controller, Post, Body} from '@nestjs/common';
import {CrawlService} from '../services/crawl.service';
import {CrawlDto} from '../dto/crawl.dto';

@Controller('crawl')
export class CrawlController {
  constructor(private service: CrawlService) {}

  @Post()
  async create(@Body() dto: CrawlDto) {
    return await this.service.crawl(dto);
  }
}
