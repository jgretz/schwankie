import type {FeedData} from 'client';

/**
 * Decorate-sort-undecorate: the timestamp is parsed once per feed rather than
 * twice per comparison, and an unparseable/missing `updatedAt` collapses to 0 so
 * a NaN can never make the comparator inconsistent (which would leave the order
 * dependent on the sort implementation).
 */
export function sortFeedsByUpdatedAt(feeds: FeedData[]): FeedData[] {
  return feeds
    .map((feed) => {
      const time = feed.updatedAt ? new Date(feed.updatedAt).getTime() : 0;
      return {feed, time: Number.isNaN(time) ? 0 : time};
    })
    .sort((a, b) => b.time - a.time)
    .map((entry) => entry.feed);
}
