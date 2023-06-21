import {Controller, Get, Query} from '@nestjs/common';
import {SearchService} from '../services/search.service';

@Controller('search')
export class SearchController {
  constructor(private service: SearchService) {}

  @Get()
  async findAll(
    @Query('query') query: string,
    @Query('skip') skip: string,
    @Query('take') take: string,
  ) {
    return this.service.search({query, skip: parseInt(skip, 10), take: parseInt(take, 10)});
  }
}
