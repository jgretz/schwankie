import {describe, it, expect} from 'bun:test';
import type {LinkWithTags} from '@domain';
import {renderAtom} from '../../src/lib/atom-render';

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
    embeddingFailCount: 0,
    embeddingLastError: null,
    score: null,
    createDate: new Date('2026-04-01T12:00:00.000Z'),
    updateDate: new Date('2026-04-02T08:30:00.000Z'),
    tags: [],
    ...overrides,
  } as LinkWithTags;
}

describe('renderAtom', function () {
  it('should render a valid empty feed when given no items', function () {
    const xml = renderAtom([]);

    expect(xml).toStartWith('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
    expect(xml).toContain('<title>schwankie</title>');
    expect(xml).toContain('<link href="https://www.schwankie.com" rel="alternate"/>');
    expect(xml).toContain('<link href="https://www.schwankie.com/atom" rel="self"/>');
    expect(xml).toContain('<id>https://www.schwankie.com/</id>');
    expect(xml).toContain('<author>');
    expect(xml).toContain('<name>Josh Gretz</name>');
    expect(xml).not.toContain('<entry>');
  });

  it('should emit one entry per input link', function () {
    const xml = renderAtom([
      makeLink({id: 1, title: 'First'}),
      makeLink({id: 2, title: 'Second'}),
    ]);

    const entryMatches = xml.match(/<entry>/g) ?? [];
    expect(entryMatches.length).toBe(2);
    expect(xml).toContain('<title>First</title>');
    expect(xml).toContain('<title>Second</title>');
  });

  it('should escape XML special characters in titles and summaries', function () {
    const xml = renderAtom([
      makeLink({
        title: 'Tom & Jerry <"hi">',
        description: "5 < 10 & 'q'",
      }),
    ]);

    expect(xml).toContain('<title>Tom &amp; Jerry &lt;&quot;hi&quot;&gt;</title>');
    expect(xml).toContain('<summary>5 &lt; 10 &amp; &apos;q&apos;</summary>');
  });

  it('should emit ISO 8601 published and updated timestamps', function () {
    const xml = renderAtom([
      makeLink({
        createDate: new Date('2026-04-01T12:00:00.000Z'),
        updateDate: new Date('2026-04-02T08:30:00.000Z'),
      }),
    ]);

    expect(xml).toContain('<published>2026-04-01T12:00:00.000Z</published>');
    expect(xml).toContain('<updated>2026-04-02T08:30:00.000Z</updated>');
  });

  it('should set feed-level <updated> to the newest item updateDate', function () {
    const xml = renderAtom([
      makeLink({id: 1, updateDate: new Date('2026-04-10T00:00:00.000Z')}),
      makeLink({id: 2, updateDate: new Date('2026-04-01T00:00:00.000Z')}),
    ]);

    const feedUpdatedMatch = xml.match(/<feed[^>]*>[\s\S]*?<updated>([^<]+)<\/updated>/);
    expect(feedUpdatedMatch).not.toBeNull();
    expect(feedUpdatedMatch![1]).toBe('2026-04-10T00:00:00.000Z');
  });

  it('should render entry id as a tag URI containing the link id', function () {
    const xml = renderAtom([makeLink({id: 42, createDate: new Date('2026-04-01T00:00:00.000Z')})]);
    expect(xml).toContain('<id>tag:schwankie.com,2026-04-01:link/42</id>');
  });

  it('should emit category elements with term attribute per tag', function () {
    const xml = renderAtom([
      makeLink({
        tags: [
          {id: 1, text: 'ai'},
          {id: 2, text: 'web-dev'},
        ],
      }),
    ]);

    expect(xml).toContain('<category term="ai"/>');
    expect(xml).toContain('<category term="web-dev"/>');
  });

  it('should emit alternate link with href attribute', function () {
    const xml = renderAtom([makeLink({url: 'https://example.com/post/1?q=a&b=c'})]);
    expect(xml).toContain('<link href="https://example.com/post/1?q=a&amp;b=c" rel="alternate"/>');
  });

  it('should fall back to truncated content when description is null', function () {
    const longContent = 'a'.repeat(800);
    const xml = renderAtom([makeLink({description: null, content: longContent})]);

    const summaryMatch = xml.match(/<summary>([^<]*)<\/summary>/);
    expect(summaryMatch).not.toBeNull();
    expect(summaryMatch![1]!.length).toBeLessThanOrEqual(501);
    expect(summaryMatch![1]!.endsWith('…')).toBe(true);
  });

  it('should emit empty summary when both description and content are null', function () {
    const xml = renderAtom([makeLink({description: null, content: null})]);
    expect(xml).toContain('<summary></summary>');
  });
});
