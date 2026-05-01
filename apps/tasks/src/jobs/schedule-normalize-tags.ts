import type PgBoss from 'pg-boss';
import {getTagsNeedingNormalization} from 'client';

const CHUNK_SIZE = 20;

export function createScheduleNormalizeTagsHandler(boss: PgBoss): PgBoss.WorkHandler<unknown> {
  return async () => {
    if (!process.env.OLLAMA_URL) {
      console.log('[schedule-normalize-tags] OLLAMA_URL not set, skipping');
      return;
    }
    try {
      const {tags} = await getTagsNeedingNormalization();
      if (tags.length === 0) return;

      const chunks: Array<Array<{id: number; text: string}>> = [];
      for (let i = 0; i < tags.length; i += CHUNK_SIZE) {
        chunks.push(tags.slice(i, i + CHUNK_SIZE).map((t) => ({id: t.id, text: t.text})));
      }

      let dispatched = 0;
      for (const chunk of chunks) {
        const sent = await boss.send('normalize-tag-chunk', {tags: chunk});
        if (sent) dispatched += 1;
      }

      console.log(
        `[schedule-normalize-tags] dispatched ${dispatched}/${chunks.length} chunks (${tags.length} tags)`,
      );
    } catch (error) {
      console.error('[schedule-normalize-tags] Failed:', error);
      throw error;
    }
  };
}
