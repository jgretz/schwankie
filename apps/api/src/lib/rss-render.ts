import type {LinkWithTags} from '@domain';

const SITE_URL = 'https://www.schwankie.com';
const SITE_TITLE = 'schwankie';
const SITE_DESCRIPTION = 'Your second memory — a well-indexed collection of links.';
const DESCRIPTION_FALLBACK_LIMIT = 500;

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function truncate(value: string, limit: number): string {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit).trimEnd()}…`;
}

function toRfc822(value: Date | string): string {
  return new Date(value).toUTCString();
}

function renderItem(item: LinkWithTags): string {
  const description =
    item.description ?? (item.content ? truncate(item.content, DESCRIPTION_FALLBACK_LIMIT) : '');
  const categories = item.tags.map((tag) => `    <category>${escapeXml(tag.text)}</category>`).join('\n');

  const parts = [
    '  <item>',
    `    <title>${escapeXml(item.title)}</title>`,
    `    <link>${escapeXml(item.url)}</link>`,
    `    <guid isPermaLink="false">${escapeXml(String(item.id))}</guid>`,
    `    <pubDate>${toRfc822(item.createDate)}</pubDate>`,
    `    <description>${escapeXml(description)}</description>`,
  ];

  if (categories) parts.push(categories);
  parts.push('  </item>');
  return parts.join('\n');
}

export function renderRss(items: LinkWithTags[]): string {
  const lastBuildDate = items.length > 0 ? toRfc822(items[0]!.createDate) : new Date().toUTCString();
  const itemsXml = items.map(renderItem).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml(SITE_TITLE)}</title>
  <link>${SITE_URL}</link>
  <description>${escapeXml(SITE_DESCRIPTION)}</description>
  <language>en-us</language>
  <lastBuildDate>${lastBuildDate}</lastBuildDate>
${itemsXml}
</channel>
</rss>
`;
}
