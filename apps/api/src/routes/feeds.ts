import {Hono} from 'hono';
import {authMiddleware} from '../middleware/auth';
import {
  listFeeds,
  createFeed,
  updateFeed,
  deleteFeed,
  getFeed,
  listRssItems,
  listAllRssItems,
  markRssItemRead,
  markAllRssItemsRead,
  promoteRssItem,
  bulkUpsertRssItems,
  getLink,
} from '@domain';
import {
  createFeedSchema,
  updateFeedSchema,
  bulkUpsertItemsSchema,
  listFeedItemsSchema,
  listAllRssItemsSchema,
} from '../validators/feeds';

function parseId(idStr: string | undefined): string | null {
  return idStr || null;
}

export const feedsRoutes = new Hono();
const auth = authMiddleware();

feedsRoutes.get('/api/rss-items', async (c) => {
  const parsed = listAllRssItemsSchema.safeParse({
    limit: c.req.query('limit'),
    offset: c.req.query('offset'),
    read: c.req.query('read'),
    feedId: c.req.query('feedId'),
  });
  if (!parsed.success) {
    return c.json({error: 'Invalid query parameters', details: parsed.error.flatten()}, 400);
  }
  const result = await listAllRssItems(parsed.data);
  return c.json(result);
});

feedsRoutes.post('/api/rss-items/mark-all-read', auth, async (c) => {
  const feedId = c.req.query('feedId') || undefined;
  const count = await markAllRssItemsRead({feedId});
  return c.json({count});
});

feedsRoutes.get('/api/feeds', async (c) => {
  const result = await listFeeds();
  return c.json(result);
});

feedsRoutes.post('/api/feeds', auth, async (c) => {
  const parsed = createFeedSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({error: 'Invalid request body', details: parsed.error.flatten()}, 400);
  }
  const result = await createFeed(parsed.data);
  return c.json(result, 201);
});

feedsRoutes.get('/api/feeds/all', auth, async (c) => {
  const result = await listFeeds();
  return c.json(result);
});

feedsRoutes.get('/api/feeds/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  if (id === null) {
    return c.json({error: 'Invalid feed ID'}, 400);
  }
  const result = await getFeed(id);
  if (!result) {
    return c.json({error: 'Feed not found'}, 404);
  }
  return c.json(result);
});

feedsRoutes.patch('/api/feeds/:id', auth, async (c) => {
  const id = parseId(c.req.param('id'));
  if (id === null) {
    return c.json({error: 'Invalid feed ID'}, 400);
  }
  const parsed = updateFeedSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({error: 'Invalid request body', details: parsed.error.flatten()}, 400);
  }
  const result = await updateFeed(id, parsed.data);
  if (!result) {
    return c.json({error: 'Feed not found'}, 404);
  }
  return c.json(result);
});

feedsRoutes.delete('/api/feeds/:id', auth, async (c) => {
  const id = parseId(c.req.param('id'));
  if (id === null) {
    return c.json({error: 'Invalid feed ID'}, 400);
  }
  const result = await deleteFeed(id);
  if (!result) {
    return c.json({error: 'Feed not found'}, 404);
  }
  return c.json({deleted: true});
});

feedsRoutes.get('/api/feeds/:feedId/items', async (c) => {
  const feedId = parseId(c.req.param('feedId'));
  if (feedId === null) {
    return c.json({error: 'Invalid feed ID'}, 400);
  }
  const parsed = listFeedItemsSchema.safeParse({
    feedId,
    limit: c.req.query('limit'),
    offset: c.req.query('offset'),
    read: c.req.query('read'),
    clicked: c.req.query('clicked'),
    q: c.req.query('q'),
  });
  if (!parsed.success) {
    return c.json({error: 'Invalid query parameters', details: parsed.error.flatten()}, 400);
  }
  const result = await listRssItems(parsed.data);
  return c.json(result);
});

feedsRoutes.post('/api/feeds/:feedId/items/:itemId/read', auth, async (c) => {
  const itemId = parseId(c.req.param('itemId'));
  if (itemId === null) {
    return c.json({error: 'Invalid item ID'}, 400);
  }
  const result = await markRssItemRead(itemId);
  if (!result) {
    return c.json({error: 'Item not found'}, 404);
  }
  return c.json({marked: true});
});

feedsRoutes.post('/api/feeds/:feedId/items/:itemId/promote', auth, async (c) => {
  const itemId = parseId(c.req.param('itemId'));
  if (itemId === null) {
    return c.json({error: 'Invalid item ID'}, 400);
  }
  const linkId = await promoteRssItem(itemId);
  if (linkId === null) {
    return c.json({error: 'Item not found'}, 404);
  }
  const link = await getLink(linkId);
  return c.json(link);
});

feedsRoutes.post('/api/feeds/:feedId/items/bulk-upsert', auth, async (c) => {
  const feedId = parseId(c.req.param('feedId'));
  if (feedId === null) {
    return c.json({error: 'Invalid feed ID'}, 400);
  }
  const parsed = bulkUpsertItemsSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({error: 'Invalid request body', details: parsed.error.flatten()}, 400);
  }
  const items = parsed.data.items.map((item) => ({
    feedId,
    guid: item.guid,
    title: item.title,
    link: item.link,
    summary: item.summary,
    content: item.content,
    imageUrl: item.imageUrl,
    publishedAt: item.pubDate,
  }));
  const count = await bulkUpsertRssItems(items);
  return c.json({inserted: count});
});
