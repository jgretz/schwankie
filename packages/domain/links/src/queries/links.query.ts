import {InjectIn} from 'injectx';
import type {LinksDomainDependencies} from '../Types';
import {ilike, or, sql} from 'drizzle-orm';
import {Schema} from 'database';

interface LinksQuery {
  page: number;
  size: number;
  query?: string;
}

function query({database}: LinksDomainDependencies) {
  return async function ({page, size, query}: LinksQuery) {
    return await database.query.link.findMany({
      limit: size,
      offset: page * size,
      orderBy: (link, {desc}) => [desc(link.updateDate)],
      where: or(
        ilike(Schema.link.title, `%${query}%`),
        ilike(Schema.link.description, `%${query}%`),
        sql`tags::jsonb ? ${query}`,
      ),
    });
  };
}

export const linksQuery = InjectIn(query);
