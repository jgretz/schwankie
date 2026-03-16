import {Hono} from 'hono';
import {db} from '../lib/db';
import {listTagsParamsSchema} from '../validators/tags';
import {listTags} from '../queries/list-tags';

export const tagsRouter = new Hono();

tagsRouter.get('/api/tags', async (c) => {
  const parsed = listTagsParamsSchema.safeParse({status: c.req.query('status') || undefined});
  if (!parsed.success) return c.json({error: 'Invalid status parameter'}, 400);

  const result = await listTags(db, parsed.data);
  return c.json(result);
});
