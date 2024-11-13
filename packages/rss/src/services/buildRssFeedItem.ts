import type {ParseRssFeed, ParseRssItem, RssFeedItem} from '../Types';
import {parseRssItemImage} from './parseRssItemImage';
import {parseRssItemSummary} from './parseRssItemSummary';

export async function buildRssFeedItem(feed: ParseRssFeed, item: ParseRssItem) {
  const image = await parseRssItemImage(feed, item);
  const summary = parseRssItemSummary(item);

  return {
    feedId: feed.feedId,
    feed: feed.title,
    guid: item.guid,
    title: item.title,
    link: item.link,
    pubDate: item.pubDate,
    summary,
    image,
  } as RssFeedItem;
}
