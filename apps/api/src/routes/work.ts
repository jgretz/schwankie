import {Hono} from 'hono';

import {
  listPendingWorkRequests,
  createWorkRequest,
  markWorkRequestProcessing,
  markWorkRequestCompleted,
  markWorkRequestFailed,
  cleanupOldWorkRequests,
} from '@domain';

import {pollPendingWorkRequests} from '../commands/poll-pending-work-requests';
import {markWorkRequestPending} from '../lib/work-request-signal';
import {authMiddleware} from '../middleware/auth';
import {workIdParamSchema, failBodySchema, pendingQuerySchema} from '../validators/work';

export const workRoutes = new Hono();
const auth = authMiddleware();

workRoutes.get('/api/work/pending', auth, async (c) => {
  const parsed = pendingQuerySchema.safeParse({mode: c.req.query('mode')});
  if (!parsed.success) {
    return c.json({error: 'Invalid query parameters', details: parsed.error.flatten()}, 400);
  }

  const results = await pollPendingWorkRequests(parsed.data.mode, listPendingWorkRequests);
  return c.json(results);
});

workRoutes.post('/api/work/:id/start', auth, async (c) => {
  const parsed = workIdParamSchema.safeParse({id: c.req.param('id')});
  if (!parsed.success) {
    return c.json({error: 'Invalid work request ID'}, 400);
  }

  const result = await markWorkRequestProcessing(parsed.data.id);
  if (!result) {
    return c.json({error: 'Work request already claimed or not found'}, 409);
  }

  return c.json(result);
});

workRoutes.post('/api/work/:id/complete', auth, async (c) => {
  const parsed = workIdParamSchema.safeParse({id: c.req.param('id')});
  if (!parsed.success) {
    return c.json({error: 'Invalid work request ID'}, 400);
  }

  const result = await markWorkRequestCompleted(parsed.data.id);
  return c.json(result);
});

workRoutes.post('/api/work/:id/fail', auth, async (c) => {
  const idParsed = workIdParamSchema.safeParse({id: c.req.param('id')});
  if (!idParsed.success) {
    return c.json({error: 'Invalid work request ID'}, 400);
  }

  const bodyParsed = failBodySchema.safeParse(await c.req.json());
  if (!bodyParsed.success) {
    return c.json({error: 'Invalid request body', details: bodyParsed.error.flatten()}, 400);
  }

  const result = await markWorkRequestFailed(idParsed.data.id, bodyParsed.data.errorMessage);
  return c.json(result);
});

workRoutes.post('/api/work/cleanup', auth, async (c) => {
  const count = await cleanupOldWorkRequests();
  return c.json({count});
});

workRoutes.post('/api/feeds/refresh', auth, async (c) => {
  const result = await createWorkRequest({type: 'refresh-all-feeds'});
  markWorkRequestPending();
  return c.json(result, 201);
});

workRoutes.post('/api/emails/refresh', auth, async (c) => {
  const result = await createWorkRequest({type: 'refresh-emails'});
  markWorkRequestPending();
  return c.json(result, 201);
});
