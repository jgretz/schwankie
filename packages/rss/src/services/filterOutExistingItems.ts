import type Parser from 'rss-parser';
import type {ParseRssFeed, ParseRssItem} from '../Types';
import {existingFeedItemQuery} from 'domain/schwankie';

export async function filterOutExistingItems(feed: ParseRssFeed & Parser.Output<ParseRssItem>) {
  const guids = feed.items.map((item) => item.guid);
  const existing = await existingFeedItemQuery({guids, feedId: feed.feedId});

  const items = feed.items.filter((item) => {
    return !existing.some((existingItem) => existingItem.guid === item.guid);
  });

  return {
    ...feed,
    items,
  } as ParseRssFeed & Parser.Output<ParseRssItem>;
}
