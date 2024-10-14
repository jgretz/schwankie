import {Elysia, t} from 'elysia';
import {linksQuery} from '../queries';

export const LinksApi = new Elysia({prefix: 'links'}).get(
  '/',
  async function ({query: {page, size}}) {
    const links = await linksQuery({page, size});

    return links;
  },
  {
    query: t.Object({
      page: t.Number(),
      size: t.Number(),
    }),
  },
);
