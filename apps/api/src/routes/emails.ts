import {Hono} from 'hono';
import {authMiddleware} from '../middleware/auth';
import {bulkUpsertEmailItems} from '@domain';
import {bulkUpsertEmailItemsSchema} from '../validators/emails';

export const emailsRouter = new Hono();
const auth = authMiddleware();

emailsRouter.post('/api/emails/bulk-upsert', auth, async (c) => {
  const parsed = bulkUpsertEmailItemsSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({error: 'Invalid request body', details: parsed.error.flatten()}, 400);
  }

  const inserted = await bulkUpsertEmailItems(parsed.data.items);
  return c.json({inserted}, 200);
});
