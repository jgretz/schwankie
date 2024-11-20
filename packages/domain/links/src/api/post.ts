import {Elysia, t} from 'elysia';
import {upsertLink} from '../commands';
import {createInsertSchema} from 'drizzle-typebox';
import {Schema} from 'database';

export const PostApi = new Elysia().post(
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
