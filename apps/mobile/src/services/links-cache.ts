import type {InfiniteData} from '@tanstack/react-query';
import type {LinksResponse} from 'client';

/**
 * Remove a single link (by id) from an infinite-query cache in place.
 *
 * Maps over every page and filters its `items`, leaving `pages` length,
 * `pageParams`, `hasMore`, and `nextOffset` untouched — pagination is NOT
 * recomputed. This keeps the visible array referentially stable except for the
 * one removed row, which is what avoids the VirtualizedList viewport jump.
 */
export function removeLinkFromInfiniteData(
  data: InfiniteData<LinksResponse> | undefined,
  id: number,
): InfiniteData<LinksResponse> | undefined {
  if (!data) return data;

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.filter((item) => item.id !== id),
    })),
  };
}
