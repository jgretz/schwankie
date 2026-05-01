import type PgBoss from 'pg-boss';
import {reportEnrichmentFailure, updateLinkContent} from 'client';

const DEAD_STATUS_CODES = new Set([400, 401, 403, 404, 405, 406, 410, 421, 422, 429]);
const SKIP_STATUS_CODES = new Set([451]);

interface EnrichLinkData {
  linkId: number;
  url: string;
  currentFailCount: number;
}

export const enrichLinkHandler: PgBoss.WorkHandler<EnrichLinkData> = async (jobs) => {
  for (const job of jobs) {
    await processOne(job);
  }
};

async function processOne(job: PgBoss.Job<EnrichLinkData>): Promise<void> {
  const {linkId, url, currentFailCount} = job.data;

  try {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: {Accept: 'text/markdown'},
    });

    if (response.ok) {
      const markdown = await response.text();
      await updateLinkContent(linkId, markdown);
      console.log(`[enrich-link] link ${linkId}: content fetched`);
      return;
    }

    if (SKIP_STATUS_CODES.has(response.status)) {
      await updateLinkContent(linkId, '');
      console.log(`[enrich-link] link ${linkId}: HTTP ${response.status}, skipped (site exists)`);
      return;
    }

    if (DEAD_STATUS_CODES.has(response.status)) {
      const failCount = currentFailCount + 1;
      await reportEnrichmentFailure(linkId, failCount, `HTTP ${response.status}`);
      console.warn(`[enrich-link] link ${linkId}: HTTP ${response.status}, fail ${failCount}/3`);
      return;
    }

    console.warn(`[enrich-link] link ${linkId}: HTTP ${response.status}, will retry`);
  } catch (error) {
    console.warn(`[enrich-link] link ${linkId}: failed`, error);
  }
}
