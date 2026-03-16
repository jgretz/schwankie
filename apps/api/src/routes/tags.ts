import {Hono} from 'hono';
import {createDatabase, getTagsWithCount, linkStatusEnum, type LinkStatus} from 'database';
import {parseEnv} from 'env';
import z from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string(),
});
const env = parseEnv(envSchema);
const db = createDatabase(env.DATABASE_URL);

export const tagsRouter = new Hono();

tagsRouter.get('/api/tags', async (c) => {
  const status = c.req.query('status');

  if (status && !(linkStatusEnum.enumValues as string[]).includes(status)) {
    return c.json({error: 'Invalid status value'}, 400);
  }

  const tags = await getTagsWithCount(db, status as LinkStatus | undefined);

  return c.json({tags});
});
