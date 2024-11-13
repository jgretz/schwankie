import {InjectIn} from 'injectx';
import type {DomainDependencies} from '../Types';

function query({database}: DomainDependencies) {
  return async function () {
    return await database.query.feedStats.findFirst();
  };
}

export const feedStatsQuery = InjectIn(query);
