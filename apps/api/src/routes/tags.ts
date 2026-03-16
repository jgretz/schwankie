import {Hono} from 'hono';
import {count, desc, eq, sql} from 'drizzle-orm';
import {createDatabase, tag, linkTag, link} from 'database';
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

  // Validate status if provided
  if (status && !['saved', 'queued', 'archived', 'trashed'].includes(status)) {
    return c.json({error: 'Invalid status value'}, 400);
  }

  let query = db
    .select({
      id: tag.id,
      text: tag.text,
      count: count(sql`DISTINCT ${linkTag.linkId}`).as('count'),
    })
    .from(tag)
    .innerJoin(linkTag, eq(tag.id, linkTag.tagId))
    .innerJoin(link, eq(linkTag.linkId, link.id));

  // Filter by status if provided
  if (status) {
    query = query.where(eq(link.status, status as 'saved' | 'queued' | 'archived' | 'trashed'));
  }

  const tags = await query
    .groupBy(tag.id, tag.text)
    .having(sql`count(DISTINCT ${linkTag.linkId}) > 0`)
    .orderBy(desc(sql`count(DISTINCT ${linkTag.linkId})`), tag.text);

  return c.json({tags});
});
