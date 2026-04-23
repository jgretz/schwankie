import {Hono} from 'hono';
import {authMiddleware} from '../middleware/auth';
import {
  bulkUpsertEmailItems,
  listEmailItems,
  markEmailItemRead,
  promoteEmailItem,
} from '@domain';
import {bulkUpsertEmailItemsSchema} from '../validators/emails';

export const emailsRouter = new Hono();
const auth = authMiddleware();

emailsRouter.get('/api/emails', async (c) => {
  const limit = c.req.query('limit') ? Number(c.req.query('limit')) : 50;
  const offset = c.req.query('offset') ? Number(c.req.query('offset')) : 0;
  const read = c.req.query('read') ? c.req.query('read') === 'true' : undefined;
  const from = c.req.query('from') || undefined;

  const result = await listEmailItems({limit, offset, read, from});
  return c.json(result);
});

emailsRouter.post('/api/emails/bulk-upsert', auth, async (c) => {
  const parsed = bulkUpsertEmailItemsSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({error: 'Invalid request body', details: parsed.error.flatten()}, 400);
  }

  const inserted = await bulkUpsertEmailItems(parsed.data.items);
  return c.json({inserted}, 200);
});

emailsRouter.post('/api/emails/:id/read', auth, async (c) => {
  const id = c.req.param('id');
  await markEmailItemRead(id);
  return c.json({marked: true});
});

emailsRouter.post('/api/emails/:id/promote', auth, async (c) => {
  const id = c.req.param('id');
  const link = await promoteEmailItem(id);
  return c.json(link);
});
