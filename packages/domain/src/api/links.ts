import {Elysia, t} from 'elysia';
import {linksQuery, linkByUrlQuery} from '../queries';
import type {Link, Links} from '../Types';
import {upsertLink} from '../services';
import {createInsertSchema} from 'drizzle-typebox';
import {Schema} from 'database';

export const LinksApi = new Elysia({prefix: 'links'})
  .get(
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
  )
  .post(
    '/',
    async function ({body}) {
      const result = await upsertLink(body);

      return result;
    },
    {
      body: t.Omit(t.Object(createInsertSchema(Schema.link).properties), [
        'createDate',
        'updateDate',
      ]),
    },
  );
