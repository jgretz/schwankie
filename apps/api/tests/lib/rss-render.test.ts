import {describe, it, expect} from 'bun:test';
import type {LinkWithTags} from '@domain';
import {renderRss} from '../../src/lib/rss-render';

function makeLink(overrides: Partial<LinkWithTags> = {}): LinkWithTags {
  return {
    id: 1,
    url: 'https://example.com/article',
    title: 'Example article',
    description: 'A short description',
    imageUrl: null,
    status: 'saved',
    content: null,
    enrichmentFailCount: 0,
    enrichmentLastError: null,
    score: null,
    createDate: new Date('2026-04-01T12:00:00.000Z'),
    updateDate: new Date('2026-04-01T12:00:00.000Z'),
    tags: [],
    ...overrides,
  } as LinkWithTags;
}

describe('renderRss', function () {
  it('should render a valid empty channel when given no items', function () {
    const xml = renderRss([]);

    expect(xml).toStartWith('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0">');
    expect(xml).toContain('<title>schwankie</title>');
    expect(xml).toContain('<link>https://www.schwankie.com</link>');
    expect(xml).toContain('<language>en-us</language>');
    expect(xml).toContain('<lastBuildDate>');
    expect(xml).not.toContain('<item>');
  });

  it('should emit one item per input link', function () {
    const xml = renderRss([
      makeLink({id: 1, title: 'First'}),
      makeLink({id: 2, title: 'Second'}),
      makeLink({id: 3, title: 'Third'}),
    ]);

    const itemMatches = xml.match(/<item>/g) ?? [];
    expect(itemMatches.length).toBe(3);
    expect(xml).toContain('<title>First</title>');
    expect(xml).toContain('<title>Second</title>');
    expect(xml).toContain('<title>Third</title>');
  });

  it('should escape XML special characters in titles and descriptions', function () {
    const xml = renderRss([
      makeLink({
        title: 'Tom & Jerry <"hello">',
        description: "5 < 10 & 'quoted'",
      }),
    ]);

    expect(xml).toContain('<title>Tom &amp; Jerry &lt;&quot;hello&quot;&gt;</title>');
    expect(xml).toContain('<description>5 &lt; 10 &amp; &apos;quoted&apos;</description>');
  });

  it('should emit an RFC-822 pubDate from createDate', function () {
    const xml = renderRss([makeLink({createDate: new Date('2026-04-01T12:00:00.000Z')})]);
    expect(xml).toContain('<pubDate>Wed, 01 Apr 2026 12:00:00 GMT</pubDate>');
  });

  it('should set lastBuildDate to the newest item createDate', function () {
    const xml = renderRss([
      makeLink({id: 1, createDate: new Date('2026-04-10T00:00:00.000Z')}),
      makeLink({id: 2, createDate: new Date('2026-04-01T00:00:00.000Z')}),
    ]);

    expect(xml).toContain('<lastBuildDate>Fri, 10 Apr 2026 00:00:00 GMT</lastBuildDate>');
  });

  it('should emit a <category> element per tag', function () {
    const xml = renderRss([
      makeLink({
        tags: [
          {id: 1, text: 'ai'},
          {id: 2, text: 'web-dev'},
          {id: 3, text: 'rust'},
        ],
      }),
    ]);

    expect(xml).toContain('<category>ai</category>');
    expect(xml).toContain('<category>web-dev</category>');
    expect(xml).toContain('<category>rust</category>');
  });

  it('should fall back to truncated content when description is null', function () {
    const longContent = 'a'.repeat(800);
    const xml = renderRss([makeLink({description: null, content: longContent})]);

    const itemDescMatches = [...xml.matchAll(/<description>([^<]*)<\/description>/g)];
    expect(itemDescMatches.length).toBe(2); // channel + one item
    const itemDescription = itemDescMatches[1]![1]!;
    expect(itemDescription.length).toBeLessThanOrEqual(501);
    expect(itemDescription.endsWith('…')).toBe(true);
  });

  it('should emit empty description on the item when both description and content are null', function () {
    const xml = renderRss([makeLink({description: null, content: null})]);
    const itemDescMatches = [...xml.matchAll(/<description>([^<]*)<\/description>/g)];
    expect(itemDescMatches.length).toBe(2);
    expect(itemDescMatches[1]![1]).toBe('');
  });

  it('should use a non-permaLink guid sourced from link id', function () {
    const xml = renderRss([makeLink({id: 42})]);
    expect(xml).toContain('<guid isPermaLink="false">42</guid>');
  });

  it('should emit the original link URL as <link>', function () {
    const xml = renderRss([makeLink({url: 'https://example.com/post/1?q=a&b=c'})]);
    expect(xml).toContain('<link>https://example.com/post/1?q=a&amp;b=c</link>');
  });
});
