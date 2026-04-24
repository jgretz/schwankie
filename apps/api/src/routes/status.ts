import {Hono} from 'hono';
import {getStatus} from '@domain';
import {authMiddleware} from '../middleware/auth';

export const statusRoutes = new Hono();
const auth = authMiddleware();

statusRoutes.get('/api/status', auth, async (c) => {
  const status = await getStatus();
  return c.json(status);
});
