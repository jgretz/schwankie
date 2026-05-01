import type PgBoss from 'pg-boss';
import {recordRunnerHeartbeat} from 'client';

export const heartbeatHandler: PgBoss.WorkHandler<unknown> = async () => {
  const workerId = process.env.WORKER_ID;
  if (!workerId) {
    console.error('[heartbeat] WORKER_ID not set on process.env');
    return;
  }
  try {
    await recordRunnerHeartbeat(workerId);
  } catch (error) {
    console.error('[heartbeat] Failed:', error);
  }
};
