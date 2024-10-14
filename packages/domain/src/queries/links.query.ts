import {InjectIn} from 'injectx';
import type {DomainDependencies} from '../Types';

interface LinksQuery {
  page: number;
  size: number;
}

function query({database}: DomainDependencies) {
  return async function ({page, size}: LinksQuery) {
    return database.query.link.findMany({
      limit: size,
      offset: page * size,
    });
  };
}

export const linksQuery = InjectIn(query);
