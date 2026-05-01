import type PgBoss from 'pg-boss';
import {getLinksNeedingEnrichment} from 'client';

const FANOUT_BATCH = 50;

export function createScheduleEnrichContentHandler(boss: PgBoss): PgBoss.WorkHandler<unknown> {
  return async () => {
    try {
      const {items: links} = await getLinksNeedingEnrichment(FANOUT_BATCH);
      if (links.length === 0) return;

      let dispatched = 0;
      for (const link of links) {
        const sent = await boss.send(
          'enrich-link',
          {
            linkId: link.id,
            url: link.url,
            currentFailCount: link.enrichmentFailCount ?? 0,
          },
          {singletonKey: String(link.id)},
        );
        if (sent) dispatched += 1;
      }

      console.log(`[schedule-enrich-content] dispatched ${dispatched}/${links.length}`);
    } catch (error) {
      console.error('[schedule-enrich-content] Failed:', error);
      throw error;
    }
  };
}
