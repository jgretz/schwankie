import {IQueryHandler, QueryHandler} from '@nestjs/cqrs';
import {Dependencies} from '@nestjs/common';
import {DATABASE} from '../../constants';
import {FindTagContainingQuery} from './findTagContaining.query';
import {Cosmos} from '../cosmos/cosmos';
import {TAGS, Tag} from './tag';

@QueryHandler(FindTagContainingQuery)
@Dependencies(DATABASE)
export class FindTagContainingHandler implements IQueryHandler<FindTagContainingQuery> {
  constructor(private readonly cosmos: Cosmos) {}

  async execute(query: FindTagContainingQuery): Promise<Tag[]> {
    return this.cosmos.query<Tag>(
      TAGS,
      `
        SELECT t.title
        FROM tags t
        WHERE CONTAINS(t.title, '${query.title}')
        ORDER BY t.title ASC
      `,
    );
  }
}
