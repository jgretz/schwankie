import Parser from 'rss-parser';
import {stripHtml} from './strip-html';

const USER_AGENT = 'Schwankie RSS Reader/1.0';
const TIMEOUT_MS = 20_000;
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 2000;

export interface ParsedRssItem {
  guid: string;
  title: string;
  link: string;
  summary?: string;
  content?: string;
  imageUrl?: string;
  // ISO-8601 UTC string (e.g. 2026-04-23T17:00:00.000Z)
  pubDate?: string;
}

export type FeedErrorType = 'timeout' | 'http' | 'parse' | 'network' | 'unknown';

export interface FeedError extends Error {
  type: FeedErrorType;
  statusCode?: number;
}

function createFeedError(message: string, type: FeedErrorType, statusCode?: number): FeedError {
  const error = new Error(message) as FeedError;
  error.type = type;
  if (statusCode) error.statusCode = statusCode;
  return error;
}

export function classifyError(error: unknown): FeedError {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('timed out') || message.includes('timeout') || message.includes('aborted')) {
    return createFeedError('Timeout: Feed took too long to respond', 'timeout');
  }

  const statusMatch = message.match(/Status code (\d+)/);
  if (statusMatch && statusMatch[1]) {
    const statusCode = parseInt(statusMatch[1], 10);
    const statusMessages: Record<number, string> = {
      401: 'HTTP 401: Authentication required',
      403: 'HTTP 403: Access forbidden',
      404: 'HTTP 404: Feed URL not found',
      410: 'HTTP 410: Feed has been removed',
      500: 'HTTP 500: Server error',
      502: 'HTTP 502: Bad gateway',
      503: 'HTTP 503: Service unavailable',
    };
    const msg = statusMessages[statusCode] || `HTTP ${statusCode}: Server returned error`;
    return createFeedError(msg, 'http', statusCode);
  }

  if (
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    message.includes('ENETUNREACH') ||
    message.includes('socket connection was closed') ||
    message.includes('certificate') ||
    message.includes('SSL') ||
    message.includes('CERT_')
  ) {
    return createFeedError('Network error: Could not connect to server', 'network');
  }

  if (
    message.includes('parse') ||
    message.includes('XML') ||
    message.includes('Char:') ||
    message.includes('not recognized as RSS')
  ) {
    return createFeedError('Parse error: Invalid or unsupported feed format', 'parse');
  }

  return createFeedError(message, 'unknown');
}

function sanitizeXml(xml: string): string {
  let sanitized = xml.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  sanitized = sanitized.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');
  return sanitized;
}

async function fetchWithTimeout(url: string): Promise<string> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
  });

  if (!response.ok) {
    throw new Error(`Status code ${response.status}`);
  }

  return response.text();
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createParser(): Parser<Record<string, unknown>, Record<string, unknown>> {
  return new Parser({
    timeout: TIMEOUT_MS,
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
    customFields: {
      item: [
        ['media:content', 'mediaContent'],
        ['media:thumbnail', 'mediaThumbnail'],
        ['content:encoded', 'contentEncoded'],
      ],
    },
  });
}

async function fetchAndParse(url: string): Promise<Parser.Output<Record<string, unknown>>> {
  const parser = createParser();

  // Fetch with our own timeout/UA, then hand XML to rss-parser. Going through
  // global fetch (not parser.parseURL) keeps the mockable seam tests rely on.
  const rawXml = await fetchWithTimeout(url);
  try {
    return await parser.parseString(rawXml);
  } catch (parseError) {
    const msg = parseError instanceof Error ? parseError.message : '';
    // Retry through sanitization for malformed XML only.
    if (msg.includes('parse') || msg.includes('XML') || msg.includes('Char:')) {
      return parser.parseString(sanitizeXml(rawXml));
    }
    throw parseError;
  }
}

export async function parseFeed(sourceUrl: string): Promise<ParsedRssItem[]> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await delay(RETRY_DELAY_MS * attempt);
    }

    try {
      const feed = await fetchAndParse(sourceUrl);
      return mapFeedItems(feed);
    } catch (error) {
      lastError = error;
      const classified = classifyError(error);
      // Permanent HTTP errors — don't retry.
      if (
        classified.type === 'http' &&
        classified.statusCode &&
        [401, 403, 404, 410].includes(classified.statusCode)
      ) {
        throw classified;
      }
    }
  }

  throw classifyError(lastError);
}

function mapFeedItems(feed: Parser.Output<Record<string, unknown>>): ParsedRssItem[] {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const nowMs = Date.now();

  const items: ParsedRssItem[] = [];
  const guids = new Set<string>();

  for (const item of feed.items || []) {
    // rss-parser exposes `isoDate` as a normalized ISO-8601 string derived
    // from <pubDate>, <dc:date>, or <published>. Prefer it over the raw
    // <pubDate> field (which is undefined for RSS 1.0 / Atom feeds).
    const isoDate = (item as {isoDate?: string}).isoDate;
    const rawPubDate = typeof item.pubDate === 'string' ? item.pubDate : undefined;
    const normalized = normalizePubDate(isoDate ?? rawPubDate, nowMs);

    if (normalized) {
      const parsed = new Date(normalized);
      if (parsed < thirtyDaysAgo) continue;
    }

    const guid = item.guid || item.link || item.title;
    if (!guid || guids.has(guid)) continue;
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
      pubDate: normalized,
    });
  }

  return items;
}

// Guard against feeds that advertise future pubDates (common when a publisher
// mis-labels a local timestamp as UTC). Anything newer than "now" gets dropped
// so the import path stores NULL rather than a wrong-future time.
function normalizePubDate(raw: string | undefined, nowMs: number): string | undefined {
  if (!raw) return undefined;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return undefined;
  if (d.getTime() > nowMs) return undefined;
  return d.toISOString();
}

function extractImageUrl(item: Record<string, unknown>): string | undefined {
  const enclosure = item.enclosure as {url?: string} | undefined;
  if (enclosure?.url) return enclosure.url;

  const mediaThumbnail = item.mediaThumbnail as {$?: {url?: string}} | undefined;
  if (mediaThumbnail?.['$']?.url) return mediaThumbnail['$'].url;

  const mediaContent = item.mediaContent as
    | Array<{$?: {url?: string; medium?: string}; url?: string; medium?: string}>
    | {$?: {url?: string; medium?: string}; url?: string; medium?: string}
    | undefined;
  if (Array.isArray(mediaContent) && mediaContent.length > 0) {
    const imageMedia = mediaContent.find((m) => m['$']?.medium === 'image' || m.medium === 'image');
    if (imageMedia?.['$']?.url) return imageMedia['$'].url;
    if (imageMedia?.url) return imageMedia.url;
    if (mediaContent[0]?.['$']?.url) return mediaContent[0]['$'].url;
    if (mediaContent[0]?.url) return mediaContent[0].url;
  } else if (mediaContent && !Array.isArray(mediaContent)) {
    if (mediaContent['$']?.url) return mediaContent['$'].url;
    if (mediaContent.url) return mediaContent.url;
  }

  const contentEncoded = item.contentEncoded as string | undefined;
  const content = item.content as string | undefined;
  const html = contentEncoded || content || '';
  const imgMatch = html.match(/<img[^>]+src="([^"]+)"/);
  return imgMatch?.[1];
}

function extractContent(item: Record<string, unknown>): string | undefined {
  const contentEncoded = item.contentEncoded as string | undefined;
  if (contentEncoded) return contentEncoded;
  const content = item.content as string | undefined;
  if (content) return content;
  return undefined;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
