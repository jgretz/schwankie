import {Elysia, t} from 'elysia';
import {linksQuery, linkByUrlQuery} from '../queries';
import type {Link} from '../Types';

export const GetApi = new Elysia()
  .get(
    '/',
    async function ({query: {page, size, query}}): Promise<Link[]> {
      const links = await linksQuery({page, size, query});

      return links;
    },
    {
      query: t.Object({
        page: t.Number(),
        size: t.Number(),
        query: t.String(),
      }),
    },
  )
  .get(
    '/byurl',
    async function ({query: {url}}): Promise<Link | undefined> {
      const link = await linkByUrlQuery({url});

      return link;
    },
    {
      query: t.Object({
        url: t.String(),
      }),
    },
  );
