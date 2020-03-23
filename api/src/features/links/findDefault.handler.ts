import {IQueryHandler, QueryHandler} from '@nestjs/cqrs';
import {Dependencies} from '@nestjs/common';
import {DATABASE} from '../../constants';
import {FindDefaultQuery} from './findDefault.query';
import {Cosmos} from '../cosmos/cosmos';
import {LINKS, Link} from './link';

@QueryHandler(FindDefaultQuery)
@Dependencies(DATABASE)
export class FindDefaultHandler implements IQueryHandler<FindDefaultQuery> {
  constructor(private readonly cosmos: Cosmos) {}

  async execute(): Promise<Link[]> {
    return this.cosmos.query<Link>(
      LINKS,
      `
        SELECT TOP 150 l.id, l.url, l.title, l.description, l.tags, l.image, l.date
          FROM links l
          ORDER BY l.date DESC
      `,
    );
  }
}
