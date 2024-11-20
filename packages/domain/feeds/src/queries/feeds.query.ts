import {InjectIn} from 'injectx';
import type {FeedsDomainDependencies} from '../Types';

function query({database}: FeedsDomainDependencies) {
  return async function () {
    return await database.query.feed.findMany();
  };
}

export const feedsQuery = InjectIn(query);
