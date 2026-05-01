import {Hono} from 'hono';
import {
  cleanupStaleRunners,
  deleteRunner,
  listRunners,
  recordHeartbeat,
  upsertRunner,
} from '@domain';
import {authMiddleware} from '../middleware/auth';
import {classifyRunner} from '../lib/runner-status';
import {upsertRunnerSchema, workerIdParamSchema} from '../validators/runners';

export const runnersRoutes = new Hono();
const auth = authMiddleware();

runnersRoutes.get('/api/runners', async (c) => {
  const rows = await listRunners();
  const now = Date.now();
  const enriched = rows.map((r) => {
    const lastBeat = new Date(r.lastHeartbeatAt).getTime();
    return {
      workerId: r.workerId,
      hostname: r.hostname,
      pid: r.pid,
      version: r.version,
      startedAt: new Date(r.startedAt).toISOString(),
      lastHeartbeatAt: new Date(r.lastHeartbeatAt).toISOString(),
      status: classifyRunner(r.lastHeartbeatAt, now),
      ageSeconds: Math.max(0, Math.floor((now - lastBeat) / 1000)),
    };
  });
  return c.json(enriched);
});

runnersRoutes.post('/api/runners', auth, async (c) => {
  const parsed = upsertRunnerSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({error: 'Invalid request body', details: parsed.error.flatten()}, 400);
  }
  await upsertRunner(parsed.data);
  return c.json({ok: true});
});

runnersRoutes.post('/api/runners/:workerId/heartbeat', auth, async (c) => {
  const parsed = workerIdParamSchema.safeParse({workerId: c.req.param('workerId')});
  if (!parsed.success) {
    return c.json({error: 'Invalid workerId', details: parsed.error.flatten()}, 400);
  }
  await recordHeartbeat(parsed.data.workerId);
  return c.json({ok: true});
});

runnersRoutes.delete('/api/runners/:workerId', auth, async (c) => {
  const parsed = workerIdParamSchema.safeParse({workerId: c.req.param('workerId')});
  if (!parsed.success) {
    return c.json({error: 'Invalid workerId', details: parsed.error.flatten()}, 400);
  }
  await deleteRunner(parsed.data.workerId);
  return c.json({ok: true});
});

runnersRoutes.post('/api/runners/cleanup', auth, async (c) => {
  const result = await cleanupStaleRunners();
  return c.json(result);
});
