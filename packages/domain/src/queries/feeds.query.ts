import {InjectIn} from 'injectx';
import type {DomainDependencies} from '../Types';

function query({database}: DomainDependencies) {
  return async function () {
    return await database.query.feed.findMany();
  };
}

export const feedsQuery = InjectIn(query);