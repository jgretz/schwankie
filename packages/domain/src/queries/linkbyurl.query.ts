import {InjectIn} from 'injectx';
import type {DomainDependencies} from '../Types';
import {eq} from 'drizzle-orm';
import {Schema} from 'database';

interface LinkByUrlQuery {
  url: string;
}

function query({database}: DomainDependencies) {
  return async function ({url}: LinkByUrlQuery) {
    return await database.query.link.findFirst({
      where: eq(Schema.link.url, url),
    });
  };
}

export const linkByUrlQuery = InjectIn(query);
