import type {FeedData} from 'client';

/** Case-insensitive substring match against the feed name or its source URL. */
export function filterFeeds(feeds: FeedData[], query: string): FeedData[] {
  if (!query) return feeds;

  const needle = query.toLowerCase();

  return feeds.filter(
    (feed) =>
      feed.name.toLowerCase().includes(needle) || feed.sourceUrl.toLowerCase().includes(needle),
  );
}
