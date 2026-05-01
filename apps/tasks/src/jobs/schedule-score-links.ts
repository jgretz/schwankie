import type PgBoss from 'pg-boss';
import {listQueueSimilarityScores} from 'client';

const BATCH_LIMIT = 100;
const TOP_K = 10;
const MIN_SIMILARITY = 0.5;

export function createScheduleScoreLinksHandler(boss: PgBoss): PgBoss.WorkHandler<unknown> {
  return async () => {
    try {
      const {items} = await listQueueSimilarityScores(BATCH_LIMIT, TOP_K, MIN_SIMILARITY);
      if (items.length === 0) return;

      let dispatched = 0;
      for (const {linkId, score} of items) {
        const sent = await boss.send('score-link', {linkId, score}, {singletonKey: String(linkId)});
        if (sent) dispatched += 1;
      }

      console.log(`[schedule-score-links] dispatched ${dispatched}/${items.length}`);
    } catch (error) {
      console.error('[schedule-score-links] Failed:', error);
      throw error;
    }
  };
}
