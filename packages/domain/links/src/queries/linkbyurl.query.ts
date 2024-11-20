import {InjectIn} from 'injectx';
import type {LinksDomainDependencies} from '../Types';
import {eq} from 'drizzle-orm';
import {Schema} from 'database';

interface LinkByUrlQuery {
  url: string;
}

function query({database}: LinksDomainDependencies) {
  return async function ({url}: LinkByUrlQuery) {
    return await database.query.link.findFirst({
      where: eq(Schema.link.url, url),
    });
  };
}

export const linkByUrlQuery = InjectIn(query);
