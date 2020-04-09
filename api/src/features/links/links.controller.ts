import {Dependencies, Get, Post, Put, Controller, Query, Body, UseGuards} from '@nestjs/common';
import {QueryBus, CommandBus} from '@nestjs/cqrs';

import {AuthorizedUserGuard} from '../user/authroizedUser.guard';

import {FindRecentQuery} from './findRecent.query';
import {FindBySearchQuery} from './findBySearch.query';
import {FindByUrlQuery} from './findByUrl.query';

import {CreateLinkCommand} from './createLink.command';
import {UpdateLinkCommand} from './updateLink.command';

import {Link} from './link';

@Controller('links')
@Dependencies(QueryBus, CommandBus)
export default class LinksController {
  constructor(private queryBus: QueryBus, private commandBus: CommandBus) {}

  @Get()
  async get(@Query('url') url: string) {
    return this.queryBus.execute(new FindByUrlQuery(url));
  }

  @Get('recent')
  async getRecent(@Query('count') count = 25, @Query('page') page = 0) {
    return this.queryBus.execute(new FindRecentQuery(count, page));
  }

  @Get('search')
  async getSearch(@Query('query') query: string) {
    return this.queryBus.execute(new FindBySearchQuery(query));
  }

  @UseGuards(new AuthorizedUserGuard())
  @Post()
  async create(@Body() link: Link) {
    return this.commandBus.execute(new CreateLinkCommand(link));
  }

  @UseGuards(new AuthorizedUserGuard())
  @Put()
  async update(@Body() link: Link) {
    return this.commandBus.execute(new UpdateLinkCommand(link));
  }
}
