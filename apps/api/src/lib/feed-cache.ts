import type {Context} from 'hono';
import type {LinkWithTags} from '@domain';

const CACHE_CONTROL = 'public, max-age=300';

export type FeedFormat = 'rss' | 'atom';

type CachedEntry = {version: string | null; xml: string};

const caches: Record<FeedFormat, CachedEntry | null> = {rss: null, atom: null};

export function resetFeedCache(): void {
  caches.rss = null;
  caches.atom = null;
}

function makeEtag(format: FeedFormat, version: string | null): string {
  return `W/"${format}-${version ?? 'empty'}"`;
}

function isNotModified(
  version: string | null,
  ifNoneMatch: string | null,
  ifModifiedSince: string | null,
  etag: string,
): boolean {
  if (ifNoneMatch && ifNoneMatch === etag) return true;
  if (ifModifiedSince && version) {
    const since = Date.parse(ifModifiedSince);
    const versionMs = Date.parse(version);
    if (!Number.isNaN(since) && !Number.isNaN(versionMs) && versionMs <= since) return true;
  }
  return false;
}

function feedHeaders(contentType: string, etag: string, version: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': CACHE_CONTROL,
    ETag: etag,
  };
  if (version) headers['Last-Modified'] = new Date(version).toUTCString();
  return headers;
}

export function evaluateConditional(
  format: FeedFormat,
  version: string | null,
  ifNoneMatch: string | null,
  ifModifiedSince: string | null,
): {etag: string; notModified: boolean} {
  const etag = makeEtag(format, version);
  return {etag, notModified: isNotModified(version, ifNoneMatch, ifModifiedSince, etag)};
}

export type FeedHandlerDeps = {
  fetchItems: () => Promise<LinkWithTags[]>;
  getVersion: () => string | null;
};

export type FeedHandlerOptions = {
  format: FeedFormat;
  contentType: string;
  render: (items: LinkWithTags[]) => string;
} & FeedHandlerDeps;

export function createFeedHandler(options: FeedHandlerOptions) {
  const {format, contentType, render, fetchItems, getVersion} = options;

  return async function feedHandler(c: Context): Promise<Response> {
    const version = getVersion();
    const {etag, notModified} = evaluateConditional(
      format,
      version,
      c.req.header('if-none-match') ?? null,
      c.req.header('if-modified-since') ?? null,
    );

    const headers = feedHeaders(contentType, etag, version);
    if (notModified) return new Response(null, {status: 304, headers});

    const cached = caches[format];
    if (cached && cached.version === version) {
      return new Response(cached.xml, {headers});
    }

    const items = await fetchItems();
    const xml = render(items);
    caches[format] = {version, xml};
    return new Response(xml, {headers});
  };
}
