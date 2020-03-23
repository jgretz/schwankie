import {Dependencies, Get, Controller} from '@nestjs/common';
import {QueryBus, CommandBus} from '@nestjs/cqrs';
import {FindDefaultQuery} from './findDefault.query';

@Controller('links')
@Dependencies(QueryBus, CommandBus)
export default class LinksController {
  constructor(private queryBus: QueryBus, private commandBus: CommandBus) {}

  @Get()
  async get() {
    return this.queryBus.execute(new FindDefaultQuery());
  }
}
