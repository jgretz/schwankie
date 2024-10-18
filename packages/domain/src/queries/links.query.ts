import {InjectIn} from 'injectx';
import type {DomainDependencies} from '../Types';
import {Links} from '@remix-run/react';

interface LinksQuery {
  page: number;
  size: number;
}

function query({database}: DomainDependencies) {
  return async function ({page, size}: LinksQuery) {
    return database.query.link.findMany({
      limit: size,
      offset: page * size,
      orderBy: (link, {desc}) => [desc(link.updateDate)],
    });
  };
}

export type Links = Awaited<ReturnType<ReturnType<typeof query>>>;
export type Link = Links[number];

export const linksQuery = InjectIn(query);
