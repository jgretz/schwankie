import {getLinksNeedingEnrichment, updateLinkContent} from 'client';

export async function enrichContent(): Promise<void> {
  const {items: links} = await getLinksNeedingEnrichment(5);

  for (const link of links) {
    try {
      const response = await fetch(`https://r.jina.ai/${link.url}`, {
        headers: {Accept: 'text/markdown'},
      });

      if (!response.ok) {
        console.warn(`[enrich] link ${link.id}: HTTP ${response.status}`);
        continue;
      }

      const markdown = await response.text();
      await updateLinkContent(link.id, markdown);

      console.log(`[enrich] link ${link.id}: content fetched`);
    } catch (error) {
      console.warn(`[enrich] link ${link.id}: failed`, error);
    }
  }
}
