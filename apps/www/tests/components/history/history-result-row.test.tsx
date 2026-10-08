import {beforeAll, describe, expect, it, mock} from 'bun:test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {HistoryMatch} from 'client';

// Unwrap createServerFn into the plain handler. Supports both the
// `.inputValidator().handler()` and bare `.handler()` shapes.
mock.module('@tanstack/react-start', () => ({
  createServerFn: () => ({
    inputValidator: () => ({
      handler: (fn: (...args: unknown[]) => unknown) => fn,
    }),
    handler: (fn: (...args: unknown[]) => unknown) => fn,
  }),
}));

type RowModule = typeof import('../../../src/components/history/history-result-row');
let HistoryResultRow: RowModule['HistoryResultRow'];

beforeAll(async function () {
  const mod = await import('../../../src/components/history/history-result-row');
  HistoryResultRow = mod.HistoryResultRow;
});

const rssMatch: HistoryMatch = {
  kind: 'rss',
  feedId: 'feed-1',
  id: 'item-1',
  title: 'At 19, Ghost founder raises $11 million to build a computer for your personal AI',
  url: 'https://techcrunch.com/2026/10/05/ghost',
  source: 'TechCrunch',
  ingestedAt: '2026-10-05T12:00:00.000Z',
  openedAt: null,
  promoted: false,
  reason: 'A startup building dedicated hardware for local LLMs',
};

function render(match: HistoryMatch): string {
  return renderToStaticMarkup(createElement(HistoryResultRow, {match}));
}

function buttons(html: string): string[] {
  return [...html.matchAll(/<button[^>]*>[^<]*<\/button>/g)].map((m) => m[0]);
}

// The class list carries `disabled:` variants, so look for the attribute itself.
const DISABLED_ATTR = /\sdisabled=""/;

describe('HistoryResultRow', function () {
  it('should link the title to the item in a new tab', function () {
    const html = render(rssMatch);
    const [anchor, text] = html.match(/<a [^>]*>([^<]*)<\/a>/) ?? [];

    expect(anchor).toContain(`href="${rssMatch.url}"`);
    expect(anchor).toContain('target="_blank"');
    expect(anchor).toContain('rel="noopener noreferrer"');
    expect(text).toBe(rssMatch.title);
  });

  it('should show the reason and the source', function () {
    const html = render(rssMatch);

    expect(html).toContain('A startup building dedicated hardware for local LLMs');
    expect(html).toContain('TechCrunch · Oct 5, 2026');
  });

  it('should offer an enabled Promote button', function () {
    const [button] = buttons(render(rssMatch));

    expect(button).toContain('>Promote</button>');
    expect(button).not.toMatch(DISABLED_ATTR);
  });

  it('should render no reason element without a reason', function () {
    const html = render({...rssMatch, reason: null});

    expect(html).not.toContain('<p');
    expect(html).toContain('TechCrunch · Oct 5, 2026');
  });

  it('should show a disabled Promoted button for an item already promoted', function () {
    const [button] = buttons(render({...rssMatch, kind: 'email', promoted: true} as HistoryMatch));

    expect(button).toContain('>Promoted</button>');
    expect(button).toMatch(DISABLED_ATTR);
  });
});
