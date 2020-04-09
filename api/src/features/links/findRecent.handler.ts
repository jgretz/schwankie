import {IQueryHandler, QueryHandler} from '@nestjs/cqrs';
import {Dependencies} from '@nestjs/common';
import {DATABASE} from '../../constants';
import {FindRecentQuery} from './findRecent.query';
import {Cosmos} from '../cosmos/cosmos';
import {LINKS, Link} from './link';

@QueryHandler(FindRecentQuery)
@Dependencies(DATABASE)
export class FindRecentHandler implements IQueryHandler<FindRecentQuery> {
  constructor(private readonly cosmos: Cosmos) {}

  async execute(query: FindRecentQuery): Promise<Link[]> {
    return this.cosmos.query<Link>(
      LINKS,
      `
        SELECT l.id, l.url, l.title, l.description, l.tags, l.image, l.date
        FROM links l
        ORDER BY l.date DESC
        OFFSET ${query.page * query.count} LIMIT ${query.count}
      `,
    );
  }
}
