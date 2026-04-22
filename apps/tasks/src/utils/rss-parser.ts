import Parser from 'rss-parser';
import {stripHtml} from './strip-html';

export interface ParsedRssItem {
  guid: string;
  title: string;
  link: string;
  summary?: string;
  content?: string;
  imageUrl?: string;
  pubDate?: string;
}

function sanitizeXml(xml: string): string {
  return xml
    .replace(/[^\x09\x0A\x0D\x20-\xD7FF\xE000-\xFFFD]/g, '')
    .replace(/&(?![a-zA-Z0-9#]+;)/g, '&amp;');
}

async function fetchFeed(url: string, retries = 1): Promise<Parser.Output<Record<string, unknown>>> {
  const parser = new Parser({
    customFields: {
      item: [
        ['media:content', 'mediaContent'],
        ['media:thumbnail', 'mediaThumbnail'],
        ['content:encoded', 'contentEncoded'],
      ],
    },
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20_000);
    const response = await fetch(url, {signal: controller.signal});
    clearTimeout(timeoutId);
    const xml = await response.text();
    return (await parser.parseString(xml)) as unknown as Parser.Output<Record<string, unknown>>;
  } catch (error) {
    if (retries > 0) {
      try {
        const response = await fetch(url, {signal: AbortSignal.timeout(20_000)});
        const xml = await response.text();
        const sanitized = sanitizeXml(xml);
        return (await parser.parseString(sanitized)) as unknown as Parser.Output<Record<string, unknown>>;
      } catch (_fallbackError) {
        throw error;
      }
    }
    throw error;
  }
}

export async function parseFeed(sourceUrl: string): Promise<ParsedRssItem[]> {
  const feed = await fetchFeed(sourceUrl);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const items: ParsedRssItem[] = [];
  const guids = new Set<string>();

  for (const item of feed.items || []) {
    const pubDate = item.pubDate ? new Date(item.pubDate) : null;
    if (pubDate && pubDate < thirtyDaysAgo) {
      continue;
    }

    const guid = item.guid || item.link || item.title;
    if (!guid || guids.has(guid)) {
      continue;
    }
    guids.add(guid);

    const imageUrl = extractImageUrl(item);
    const content = extractContent(item);
    const summary = item.contentSnippet || item.summary || '';

    items.push({
      guid,
      title: stripHtml(item.title || 'Untitled'),
      link: item.link || '',
      summary: stripHtml(summary),
      content,
      imageUrl,
      pubDate: item.pubDate,
    });
  }

  return items;
}

function extractImageUrl(item: Record<string, unknown>): string | undefined {
  const mediaThumbnail = item.mediaThumbnail as {'$'?: {url?: string}} | undefined;
  if (mediaThumbnail?.['$']?.url) return mediaThumbnail['$'].url;

  const mediaContent = item.mediaContent as Array<{'$'?: {url?: string; medium?: string}; url?: string; medium?: string}> | undefined;
  if (mediaContent && mediaContent.length > 0) {
    const imageMedia = mediaContent.find((m) => m['$']?.medium === 'image' || m.medium === 'image');
    if (imageMedia?.['$']?.url) return imageMedia['$'].url;
    if (imageMedia?.url) return imageMedia.url;
  }

  return undefined;
}

function extractContent(item: Record<string, unknown>): string | undefined {
  const contentEncoded = item.contentEncoded as string | undefined;
  if (contentEncoded) {
    return contentEncoded;
  }

  return undefined;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
