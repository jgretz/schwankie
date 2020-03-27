import {Dependencies, Get, Controller, Query} from '@nestjs/common';
import {QueryBus, CommandBus} from '@nestjs/cqrs';
import {FindTagContainingQuery} from './findTagContaining.query';

@Controller('tags')
@Dependencies(QueryBus, CommandBus)
export default class TagsController {
  constructor(private queryBus: QueryBus, private commandBus: CommandBus) {}

  @Get('containing')
  async getContaining(@Query('title') title: string) {
    return this.queryBus.execute(new FindTagContainingQuery(title));
  }
}
