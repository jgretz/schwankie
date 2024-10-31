import {Elysia, t} from 'elysia';
import {linksQuery, type Links} from '../queries';

export const LinksApi = new Elysia({prefix: 'links'}).get(
  '/',
  async function ({query: {page, size, query}}): Promise<Links> {
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
);
