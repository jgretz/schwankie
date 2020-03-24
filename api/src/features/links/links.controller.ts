import {Dependencies, Get, Controller, Query} from '@nestjs/common';
import {QueryBus, CommandBus} from '@nestjs/cqrs';
import {FindRecentQuery} from './findRecent.query';
import {FindBySearchQuery} from './findBySearch.query';

@Controller('links')
@Dependencies(QueryBus, CommandBus)
export default class LinksController {
  constructor(private queryBus: QueryBus, private commandBus: CommandBus) {}

  @Get()
  async get() {
    return this.getRecent();
  }

  @Get('recent')
  async getRecent(@Query('count') count = 25) {
    return this.queryBus.execute(new FindRecentQuery(count));
  }

  @Get('search')
  async getSearch(@Query('query') query: string) {
    return this.queryBus.execute(new FindBySearchQuery(query));
  }
}
