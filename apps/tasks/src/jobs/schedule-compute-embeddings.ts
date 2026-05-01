import type PgBoss from 'pg-boss';
import {listPendingEmbeddings} from 'client';

const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
const FANOUT_BATCH = 50;

export function createScheduleComputeEmbeddingsHandler(boss: PgBoss): PgBoss.WorkHandler<unknown> {
  return async () => {
    if (!process.env.OLLAMA_URL) {
      console.log('[schedule-compute-embeddings] OLLAMA_URL not set, skipping');
      return;
    }
    try {
      const {items} = await listPendingEmbeddings(EMBED_MODEL, FANOUT_BATCH);
      if (items.length === 0) return;

      let dispatched = 0;
      for (const item of items) {
        const sent = await boss.send(
          'embed-link',
          {
            linkId: item.id,
            title: item.title,
            description: item.description,
            content: item.content,
            currentFailCount: item.embeddingFailCount ?? 0,
            model: EMBED_MODEL,
          },
          {singletonKey: String(item.id)},
        );
        if (sent) dispatched += 1;
      }

      console.log(`[schedule-compute-embeddings] dispatched ${dispatched}/${items.length}`);
    } catch (error) {
      console.error('[schedule-compute-embeddings] Failed:', error);
      throw error;
    }
  };
}
