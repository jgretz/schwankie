import type PgBoss from 'pg-boss';
import {updateLinkScore} from 'client';

interface ScoreLinkData {
  linkId: number;
  score: number;
}

export const scoreLinkHandler: PgBoss.WorkHandler<ScoreLinkData> = async (jobs) => {
  for (const job of jobs) {
    const {linkId, score} = job.data;
    try {
      await updateLinkScore(linkId, score);
      console.log(`[score-link] ${linkId}: scored ${score}`);
    } catch (error) {
      console.warn(`[score-link] ${linkId}: failed`, error);
    }
  }
};
