import {Hono} from 'hono';
import {listLinks} from '@domain';
import {getLinksVersion} from '../lib/links-version';
import {renderRss} from '../lib/rss-render';

const RSS_ITEM_LIMIT = 50;
const RSS_HEADERS = {
  'Content-Type': 'application/rss+xml; charset=utf-8',
  'Cache-Control': 'public, max-age=300',
} as const;

let cached: {version: string | null; xml: string} | null = null;

export function resetRssCache(): void {
  cached = null;
}

export const rssRoutes = new Hono();

rssRoutes.get('/api/rss', async () => {
  const version = getLinksVersion();

  if (cached && cached.version === version) {
    return new Response(cached.xml, {headers: RSS_HEADERS});
  }

  const {items} = await listLinks({
    limit: RSS_ITEM_LIMIT,
    offset: 0,
    status: 'saved',
    sort: 'date',
  });
  const xml = renderRss(items);
  cached = {version, xml};
  return new Response(xml, {headers: RSS_HEADERS});
});
