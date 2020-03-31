import {Dependencies, Get, Controller, Query} from '@nestjs/common';
import {QueryBus, CommandBus} from '@nestjs/cqrs';
import {FindTagQuery} from './findTag.query';
import {FindTagQueryType} from './constants';

@Controller('tags')
@Dependencies(QueryBus, CommandBus)
export default class TagsController {
  constructor(private queryBus: QueryBus, private commandBus: CommandBus) {}

  @Get('startsWith')
  async getStartsWith(@Query('term') term: string) {
    return this.queryBus.execute(new FindTagQuery(FindTagQueryType.StartsWith, term));
  }

  @Get('containing')
  async getContaining(@Query('term') term: string) {
    return this.queryBus.execute(new FindTagQuery(FindTagQueryType.Contains, term));
  }
}
