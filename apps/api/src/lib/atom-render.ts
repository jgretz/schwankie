import type {LinkWithTags} from '@domain';

const SITE_URL = 'https://www.schwankie.com';
const FEED_URL = 'https://www.schwankie.com/atom';
const SITE_TITLE = 'schwankie';
const SITE_SUBTITLE = 'Your second memory — a well-indexed collection of links.';
const AUTHOR_NAME = 'Josh Gretz';
const SUMMARY_FALLBACK_LIMIT = 500;

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

function toIso(value: Date | string): string {
  return new Date(value).toISOString();
}

function entryId(item: LinkWithTags): string {
  const created = new Date(item.createDate).toISOString().slice(0, 10);
  return `tag:schwankie.com,${created}:link/${item.id}`;
}

function renderEntry(item: LinkWithTags): string {
  const summary =
    item.description ?? (item.content ? truncate(item.content, SUMMARY_FALLBACK_LIMIT) : '');
  const updatedIso = toIso(item.updateDate);
  const publishedIso = toIso(item.createDate);
  const categories = item.tags
    .map((tag) => `    <category term="${escapeXml(tag.text)}"/>`)
    .join('\n');

  const parts = [
    '  <entry>',
    `    <title>${escapeXml(item.title)}</title>`,
    `    <link href="${escapeXml(item.url)}" rel="alternate"/>`,
    `    <id>${escapeXml(entryId(item))}</id>`,
    `    <published>${publishedIso}</published>`,
    `    <updated>${updatedIso}</updated>`,
    `    <summary>${escapeXml(summary)}</summary>`,
  ];

  if (categories) parts.push(categories);
  parts.push('  </entry>');
  return parts.join('\n');
}

export function renderAtom(items: LinkWithTags[]): string {
  const feedUpdated = items.length > 0 ? toIso(items[0]!.updateDate) : new Date().toISOString();
  const entriesXml = items.map(renderEntry).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(SITE_TITLE)}</title>
  <subtitle>${escapeXml(SITE_SUBTITLE)}</subtitle>
  <link href="${SITE_URL}" rel="alternate"/>
  <link href="${FEED_URL}" rel="self"/>
  <id>${SITE_URL}/</id>
  <updated>${feedUpdated}</updated>
  <author>
    <name>${escapeXml(AUTHOR_NAME)}</name>
  </author>
${entriesXml}
</feed>
`;
}
