import {Hono} from 'hono';
import {authMiddleware} from '../middleware/auth';
import {
  bulkUpsertEmailItems,
  listEmailItems,
  markAllEmailItemsRead,
  markEmailItemRead,
  promoteEmailItem,
} from '@domain';
import {capturePromoteFailure} from '../commands/capture-promote-failure';
import {bulkUpsertEmailItemsSchema, emailItemIdParamSchema} from '../validators/emails';

export const emailsRouter = new Hono();
const auth = authMiddleware();

emailsRouter.get('/api/emails', auth, async (c) => {
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

emailsRouter.post('/api/emails/mark-all-read', auth, async (c) => {
  const from = c.req.query('from') || undefined;
  const count = await markAllEmailItemsRead({from});
  return c.json({count});
});

emailsRouter.post('/api/emails/:id/read', auth, async (c) => {
  const parsed = emailItemIdParamSchema.safeParse({id: c.req.param('id')});
  if (!parsed.success) {
    return c.json({error: 'Invalid email item ID'}, 400);
  }

  await markEmailItemRead(parsed.data.id);
  return c.json({marked: true});
});

emailsRouter.post('/api/emails/:id/promote', auth, async (c) => {
  const parsed = emailItemIdParamSchema.safeParse({id: c.req.param('id')});
  if (!parsed.success) {
    return c.json({error: 'Invalid email item ID'}, 400);
  }

  // Capture outside the command's transaction, and rethrow untouched so
  // error-handler.ts still maps NotFoundError to 404 and
  // DomainValidationError to 422. promoteEmailItem signals not-found by
  // throwing, so one catch covers both.
  try {
    const link = await promoteEmailItem(parsed.data.id);
    return c.json(link);
  } catch (error) {
    await capturePromoteFailure({source: 'email', sourceItemId: parsed.data.id, error});
    throw error;
  }
});
