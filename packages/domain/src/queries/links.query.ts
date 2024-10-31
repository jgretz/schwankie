import {InjectIn} from 'injectx';
import type {DomainDependencies} from '../Types';
import {ilike, or, sql} from 'drizzle-orm';
import {Schema} from 'database';

interface LinksQuery {
  page: number;
  size: number;
  query?: string;
}

function query({database}: DomainDependencies) {
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

export type Links = Awaited<ReturnType<ReturnType<typeof query>>>;
export type Link = Links[number];

export const linksQuery = InjectIn(query);
