import {getLinksNeedingEnrichment, updateLinkContent, reportEnrichmentFailure} from 'client';

const DEAD_STATUS_CODES = new Set([400, 401, 403, 404, 405, 406, 410, 421, 422, 429]);
const SKIP_STATUS_CODES = new Set([451]);

export async function enrichContent(): Promise<void> {
  const {items: links} = await getLinksNeedingEnrichment(5);

  for (const link of links) {
    try {
      const response = await fetch(`https://r.jina.ai/${link.url}`, {
        headers: {Accept: 'text/markdown'},
      });

      if (response.ok) {
        const markdown = await response.text();
        await updateLinkContent(link.id, markdown);
        console.log(`[enrich] link ${link.id}: content fetched`);
        continue;
      }

      if (SKIP_STATUS_CODES.has(response.status)) {
        await updateLinkContent(link.id, '');
        console.log(`[enrich] link ${link.id}: HTTP ${response.status}, skipped (site exists)`);
        continue;
      }

      if (DEAD_STATUS_CODES.has(response.status)) {
        const failCount = (link.enrichmentFailCount ?? 0) + 1;
        await reportEnrichmentFailure(link.id, failCount, `HTTP ${response.status}`);
        console.warn(`[enrich] link ${link.id}: HTTP ${response.status}, fail ${failCount}/3`);
        continue;
      }

      // 5xx or unexpected — transient, just log
      console.warn(`[enrich] link ${link.id}: HTTP ${response.status}, will retry`);
    } catch (error) {
      console.warn(`[enrich] link ${link.id}: failed`, error);
    }
  }
}
