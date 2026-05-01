import type PgBoss from 'pg-boss';
import {cleanupStaleRunners} from 'client';

export const cleanupRunnersHandler: PgBoss.WorkHandler<unknown> = async () => {
  try {
    const {deleted} = await cleanupStaleRunners();
    if (deleted > 0) {
      console.log(`[cleanup-runners] Deleted ${deleted} stale runner row(s)`);
    }
  } catch (error) {
    console.error('[cleanup-runners] Failed:', error);
  }
};
