import type {InfiniteData} from '@tanstack/react-query';
import type {LinkData, LinksResponse} from 'client';

export function makeLink(overrides: Partial<LinkData> = {}): LinkData {
  return {
    id: 1,
    url: 'https://example.com',
    title: 'Example',
    description: null,
    imageUrl: null,
    status: 'queued',
    content: null,
    enrichmentFailCount: 0,
    enrichmentLastError: null,
    embeddingFailCount: 0,
    embeddingLastError: null,
    score: null,
    createDate: '2026-01-01T00:00:00.000Z',
    updateDate: '2026-01-01T00:00:00.000Z',
    tags: [],
    ...overrides,
  };
}

export function makePage(overrides: Partial<LinksResponse> = {}): LinksResponse {
  return {
    items: [makeLink()],
    hasMore: false,
    nextOffset: 0,
    total: 1,
    ...overrides,
  };
}

const PAGE_SIZE = 25;

export function makeInfiniteData(pages: LinksResponse[]): InfiniteData<LinksResponse> {
  return {
    pages,
    // Mirror real offset pagination: page 0 → offset 0, page 1 → offset 25, …
    pageParams: pages.map((_, index) => index * PAGE_SIZE),
  };
}
