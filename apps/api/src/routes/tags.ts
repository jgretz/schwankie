import {Hono} from 'hono';
import {authMiddleware} from '../middleware/auth';
import {
  listTags,
  mergeTag,
  markTagNormalized,
  renameTag,
  deleteTag,
  resolveTagMinCount,
} from '@domain';
import {listTagsParamsSchema, mergeTagSchema, renameTagSchema} from '../validators/tags';
import {parseIdParam} from '../lib/parse-id-param';

export const tagsRouter = new Hono();
const auth = authMiddleware();

tagsRouter.get('/api/tags', auth, async (c) => {
  const needs_normalization = c.req.query('needs_normalization') === 'true' ? true : undefined;
  const canonical = c.req.query('canonical') === 'true' ? true : undefined;
  const all = c.req.query('all') === 'true';

  // Read tag count floor setting — only for saved/default lists, not queue or admin
  const status = c.req.query('status') || undefined;
  let minCount: number | undefined;
  if (!needs_normalization && !canonical && !all && status !== 'queued') {
    minCount = await resolveTagMinCount();
  }

  const parsed = listTagsParamsSchema.safeParse({
    status,
    needs_normalization,
    canonical,
    limit: c.req.query('limit') || undefined,
    minCount,
  });
  if (!parsed.success) return c.json({error: 'Invalid query parameters'}, 400);

  const result = await listTags(parsed.data);
  return c.json(result);
});

tagsRouter.post('/api/tags/:id/merge', auth, async (c) => {
  const aliasTagId = parseIdParam(c);
  if (aliasTagId === null) return c.json({error: 'Invalid tag ID'}, 400);

  const parsed = mergeTagSchema.safeParse(await c.req.json());
  if (!parsed.success)
    return c.json({error: 'Invalid request body', details: parsed.error.flatten()}, 400);

  const result = await mergeTag({aliasTagId, canonicalTagId: parsed.data.canonicalTagId});
  if (!result) return c.json({error: 'Tag not found'}, 404);

  return c.json({merged: true});
});

tagsRouter.patch('/api/tags/:id/normalize', auth, async (c) => {
  const tagId = parseIdParam(c);
  if (tagId === null) return c.json({error: 'Invalid tag ID'}, 400);

  const normalized = await markTagNormalized(tagId);
  if (!normalized) return c.json({error: 'Tag not found'}, 404);

  return c.json({normalized: true});
});

tagsRouter.patch('/api/tags/:id', auth, async (c) => {
  const tagId = parseIdParam(c);
  if (tagId === null) return c.json({error: 'Invalid tag ID'}, 400);

  const parsed = renameTagSchema.safeParse(await c.req.json());
  if (!parsed.success)
    return c.json({error: 'Invalid request body', details: parsed.error.flatten()}, 400);

  const result = await renameTag({id: tagId, text: parsed.data.text});
  if (!result) return c.json({error: 'Tag not found'}, 404);

  return c.json({renamed: true});
});

tagsRouter.delete('/api/tags/:id', auth, async (c) => {
  const tagId = parseIdParam(c);
  if (tagId === null) return c.json({error: 'Invalid tag ID'}, 400);

  const result = await deleteTag(tagId);
  if (!result) return c.json({error: 'Tag not found'}, 404);

  return c.json({deleted: true});
});
