import {extractMetadata} from 'metadata';
import {getLink, updateLink} from '@domain';
import type {LinkWithTags, UpdateLinkInput} from '@domain';

export async function refetchLink(id: number): Promise<LinkWithTags | null> {
  const link = await getLink(id);
  if (!link) return null;

  const [meta, content] = await Promise.allSettled([
    extractMetadata(link.url),
    fetchJinaContent(link.url),
  ]);

  const metaData = meta.status === 'fulfilled' ? meta.value : null;
  const markdown = content.status === 'fulfilled' ? content.value : null;

  if (meta.status === 'rejected') {
    console.warn(`[refetch] link ${id}: metadata failed`, meta.reason);
  }
  if (content.status === 'rejected') {
    console.warn(`[refetch] link ${id}: jina failed`, content.reason);
  }

  const updates: Partial<UpdateLinkInput> = {};

  if (metaData) {
    updates.title = metaData.title;
    updates.description = metaData.description ?? undefined;
    updates.imageUrl = metaData.imageUrl ?? undefined;
  }

  if (markdown !== null) {
    updates.content = markdown;
    updates.enrichmentFailCount = 0;
    updates.enrichmentLastError = null;
  }

  if (Object.keys(updates).length === 0) return link;

  const updated = await updateLink(id, updates);
  return updated ?? link;
}

async function fetchJinaContent(url: string): Promise<string> {
  const response = await fetch(`https://r.jina.ai/${url}`, {
    headers: {Accept: 'text/markdown'},
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Jina HTTP ${response.status}`);
  }

  return response.text();
}
