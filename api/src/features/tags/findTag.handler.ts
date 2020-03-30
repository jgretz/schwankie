import {IQueryHandler, QueryHandler} from '@nestjs/cqrs';
import {Dependencies} from '@nestjs/common';
import {DATABASE} from '../../constants';
import {FindTagQuery} from './findTag.query';
import {Cosmos} from '../cosmos/cosmos';
import {TAGS, Tag} from './tag';
import {FindTagQueryType} from './constants';

const SEARCH_FUNC_MAP = {
  [FindTagQueryType.Contains]: 'CONTAINS',
  [FindTagQueryType.StartsWith]: 'STARTSWITH',
};

@QueryHandler(FindTagQuery)
@Dependencies(DATABASE)
export class FindTagHandler implements IQueryHandler<FindTagQuery> {
  constructor(private readonly cosmos: Cosmos) {}

  async execute(query: FindTagQuery): Promise<Tag[]> {
    const searchFunc = SEARCH_FUNC_MAP[query.type];

    return this.cosmos.query<Tag>(
      TAGS,
      `
        SELECT t.title
        FROM tags t
        WHERE ${searchFunc}(t.title, '${query.term}')
        ORDER BY t.title ASC
      `,
    );
  }
}
