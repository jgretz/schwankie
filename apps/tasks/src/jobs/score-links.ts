import type PgBoss from 'pg-boss';
import {listQueueSimilarityScores, updateLinkScore} from 'client';

const BATCH_LIMIT = 100;
const TOP_K = 10;
const MIN_SIMILARITY = 0.5;

export const scoreLinksHandler: PgBoss.WorkHandler<unknown> = async () => {
  await scoreLinks();
};

export async function scoreLinks(): Promise<void> {
  const {items} = await listQueueSimilarityScores(BATCH_LIMIT, TOP_K, MIN_SIMILARITY);
  if (items.length === 0) return;

  for (const {linkId, score} of items) {
    try {
      await updateLinkScore(linkId, score);
      console.log(`[score] link ${linkId}: scored ${score}`);
    } catch (error) {
      console.warn(`[score] link ${linkId}: failed`, error);
    }
  }
}
