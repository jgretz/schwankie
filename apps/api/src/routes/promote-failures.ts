import {Hono} from 'hono';
import {listPromoteFailures} from '@domain';
import {authMiddleware} from '../middleware/auth';
import {listPromoteFailuresSchema} from '../validators/promote-failures';

export const promoteFailuresRoutes = new Hono();
const auth = authMiddleware();

promoteFailuresRoutes.get('/api/promote-failures', auth, async (c) => {
  const parsed = listPromoteFailuresSchema.safeParse({
    limit: c.req.query('limit'),
    offset: c.req.query('offset'),
    source: c.req.query('source'),
  });
  if (!parsed.success) {
    return c.json({error: 'Invalid query parameters', details: parsed.error.flatten()}, 400);
  }

  const result = await listPromoteFailures(parsed.data);
  return c.json(result);
});
