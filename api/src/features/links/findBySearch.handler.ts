import {toLower, trim} from 'lodash';
import {IQueryHandler, QueryHandler} from '@nestjs/cqrs';
import {Dependencies} from '@nestjs/common';
import {DATABASE} from '../../constants';
import {FindBySearchQuery} from './findBySearch.query';
import {Cosmos} from '../cosmos/cosmos';
import {LINKS, Link} from './link';

const splitTerms = (query: string): string[] => query.split(',').map(toLower).map(trim);

const makeTitleClauses = (terms: string[]) => terms.map((term) => `CONTAINS(l.title, '${term}')`);
const makeTagClauses = (terms: string[]) =>
  terms.map((term) => `ARRAY_CONTAINS(l.tags, '${term}')`);

@QueryHandler(FindBySearchQuery)
@Dependencies(DATABASE)
export class FindBySearchHandler implements IQueryHandler<FindBySearchQuery> {
  constructor(private readonly cosmos: Cosmos) {}

  async execute(query: FindBySearchQuery): Promise<Link[]> {
    const terms = splitTerms(query.query);
    const titleClauses = makeTitleClauses(terms);
    const tagClauses = makeTagClauses(terms);

    return this.cosmos.query<Link>(
      LINKS,
      `
        SELECT l.id, l.url, l.title, l.description, l.tags, l.image, l.date
        FROM links l
        where (
          (${titleClauses.join(' AND ')})
          OR
          (${tagClauses.join(' AND ')})
        )
        ORDER BY l.date DESC
      `,
    );
  }
}
