import {feedsQuery} from 'domain/schwankie';
import {parseRssFeed} from './parseRssFeed';

export async function buildFeedItemList(includeRead: boolean) {
  const feeds = await feedsQuery();

  const feedItems = await Promise.all(
    feeds.map((feed) => {
      return parseRssFeed(feed.feedUrl);
    }),
  );

  const ordered = feedItems
    .flatMap((items) => items)
    .sort((a, b) => {
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });

  return ordered;
}
