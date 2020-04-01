import {IQueryHandler, QueryHandler} from '@nestjs/cqrs';
import {Dependencies} from '@nestjs/common';
import {DATABASE} from '../../constants';
import {FindBySearchQuery} from './findBySearch.query';
import {Cosmos} from '../cosmos/cosmos';
import {LINKS, Link} from './link';

@QueryHandler(FindBySearchQuery)
@Dependencies(DATABASE)
export class FindBySearchHandler implements IQueryHandler<FindBySearchQuery> {
  constructor(private readonly cosmos: Cosmos) {}

  async execute(query: FindBySearchQuery): Promise<Link[]> {
    const term = query.query.toLowerCase();

    return this.cosmos.query<Link>(
      LINKS,
      `
        SELECT l.id, l.url, l.title, l.description, l.tags, l.image, l.date
        FROM links l
        where (
          (CONTAINS(l.title, '${term}'))
          OR
          (ARRAY_CONTAINS(l.tags, '${term}'))
        )
        ORDER BY l.date DESC
      `,
    );
  }
}
