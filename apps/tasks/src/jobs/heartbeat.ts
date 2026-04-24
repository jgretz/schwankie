import type PgBoss from 'pg-boss';
import {setSetting} from 'client';

export const heartbeatHandler: PgBoss.WorkHandler<unknown> = async () => {
  try {
    await setSetting('tasks_heartbeat_at', new Date().toISOString());
  } catch (error) {
    console.error('[heartbeat] Failed:', error);
  }
};
