import {Hono} from 'hono';
import {authMiddleware} from '../middleware/auth';
import {listLinks, createLink, updateLink, deleteLink, getLink, resetEnrichment} from '@domain';
import {refetchLink} from '../commands/refetch-link';
import {suggestTags} from '../commands/suggest-tags';
import {createLinkSchema, updateLinkSchema, listLinksParamsSchema} from '../validators/links';

export const linksRoutes = new Hono();
const auth = authMiddleware();

linksRoutes.get('/api/links', async (c) => {
  const parsed = listLinksParamsSchema.safeParse({
    limit: c.req.query('limit'),
    offset: c.req.query('offset'),
    status: c.req.query('status') || undefined,
    tags: c.req.query('tags') || undefined,
    q: c.req.query('q') || undefined,
    ids: c.req.query('ids') || undefined,
    needs_enrichment: c.req.query('needs_enrichment') || undefined,
    dead_enrichment: c.req.query('dead_enrichment') || undefined,
    sort: c.req.query('sort') || undefined,
    needs_scoring: c.req.query('needs_scoring') || undefined,
  });
  if (!parsed.success) {
    return c.json({error: 'Invalid query parameters', details: parsed.error.flatten()}, 400);
  }
  const result = await listLinks(parsed.data);
  return c.json(result);
});

linksRoutes.post('/api/links', auth, async (c) => {
  const parsed = createLinkSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({error: 'Invalid request body', details: parsed.error.flatten()}, 400);
  }
  const result = await createLink(parsed.data);
  return c.json(result, 201);
});

linksRoutes.get('/api/links/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (Number.isNaN(id)) {
    return c.json({error: 'Invalid link ID'}, 400);
  }
  const result = await getLink(id);
  if (!result) {
    return c.json({error: 'Link not found'}, 404);
  }
  return c.json(result);
});

linksRoutes.patch('/api/links/:id', auth, async (c) => {
  const id = Number(c.req.param('id'));
  if (Number.isNaN(id)) {
    return c.json({error: 'Invalid link ID'}, 400);
  }
  const parsed = updateLinkSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({error: 'Invalid request body', details: parsed.error.flatten()}, 400);
  }
  const result = await updateLink(id, parsed.data);
  if (!result) {
    return c.json({error: 'Link not found'}, 404);
  }
  return c.json(result);
});

linksRoutes.patch('/api/links/:id/reset-enrichment', auth, async (c) => {
  const id = Number(c.req.param('id'));
  if (Number.isNaN(id)) {
    return c.json({error: 'Invalid link ID'}, 400);
  }
  const result = await resetEnrichment(id);
  if (!result) {
    return c.json({error: 'Link not found'}, 404);
  }
  return c.json({reset: true});
});

linksRoutes.post('/api/links/:id/refetch', auth, async (c) => {
  const id = Number(c.req.param('id'));
  if (Number.isNaN(id)) {
    return c.json({error: 'Invalid link ID'}, 400);
  }
  const result = await refetchLink(id);
  if (!result) {
    return c.json({error: 'Link not found'}, 404);
  }
  return c.json(result);
});

linksRoutes.post('/api/links/:id/suggest-tags', auth, async (c) => {
  const id = Number(c.req.param('id'));
  if (Number.isNaN(id)) {
    return c.json({error: 'Invalid link ID'}, 400);
  }
  const result = await suggestTags(id, process.env.ANTHROPIC_API_KEY);
  if (!result) {
    return c.json({error: 'Link not found'}, 404);
  }
  return c.json(result);
});

linksRoutes.delete('/api/links/:id', auth, async (c) => {
  const id = Number(c.req.param('id'));
  if (Number.isNaN(id)) {
    return c.json({error: 'Invalid link ID'}, 400);
  }
  const deleted = await deleteLink(id);
  if (!deleted) {
    return c.json({error: 'Link not found'}, 404);
  }
  return c.json({deleted: true});
});
