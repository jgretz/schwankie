import {Hono} from 'hono';
import {authMiddleware} from '../middleware/auth';
import {listTags, mergeTag, markTagNormalized} from '@domain';
import {listTagsParamsSchema, mergeTagSchema} from '../validators/tags';

export const tagsRouter = new Hono();
const auth = authMiddleware();

tagsRouter.get('/api/tags', async (c) => {
  const parsed = listTagsParamsSchema.safeParse({
    status: c.req.query('status') || undefined,
    needs_normalization: c.req.query('needs_normalization') || undefined,
    canonical: c.req.query('canonical') || undefined,
  });
  if (!parsed.success) return c.json({error: 'Invalid query parameters'}, 400);

  const result = await listTags(parsed.data);
  return c.json(result);
});

tagsRouter.post('/api/tags/:id/merge', auth, async (c) => {
  const aliasTagId = Number(c.req.param('id'));
  if (Number.isNaN(aliasTagId)) return c.json({error: 'Invalid tag ID'}, 400);

  const parsed = mergeTagSchema.safeParse(await c.req.json());
  if (!parsed.success)
    return c.json({error: 'Invalid request body', details: parsed.error.flatten()}, 400);

  const result = await mergeTag({aliasTagId, canonicalTagId: parsed.data.canonicalTagId});
  if (!result) return c.json({error: 'Tag not found'}, 404);

  return c.json({merged: true});
});

tagsRouter.patch('/api/tags/:id/normalize', auth, async (c) => {
  const tagId = Number(c.req.param('id'));
  if (Number.isNaN(tagId)) return c.json({error: 'Invalid tag ID'}, 400);

  const normalized = await markTagNormalized(tagId);
  if (!normalized) return c.json({error: 'Tag not found'}, 404);

  return c.json({normalized: true});
});
