import {feedItemBulkInsert, feedsQuery, updateFeedStatsLastLoad} from 'domain/schwankie';
import {buildRssFeedItem} from './buildRssFeedItem';
import type {ParseRssFeed, ParseRssItem, RssFeedItem} from '../Types';
import type Parser from 'rss-parser';
import {fetchNewItemsForFeed} from './fetchNewItemsForFeed';
import {mapRssFeedItemToFeedItem} from './maps/rssFeedItemToFeedItem.map';

async function buildRssFeedItems(feed: ParseRssFeed & Parser.Output<ParseRssItem>) {
  return await Promise.all(feed.items.map((item) => buildRssFeedItem(feed, item)));
}

function dedupeRssItems() {
  const seen = new Set<string>();

  return function (item: RssFeedItem) {
    if (seen.has(item.guid)) {
      return false;
    }

    seen.add(item.guid);
    return true;
  };
}

export async function refreshFeeds() {
  const feeds = await feedsQuery();
  const feedsWithOnlyNewItems = await Promise.all(feeds.map(fetchNewItemsForFeed));
  const feedsWithRssFeedItems = await Promise.all(feedsWithOnlyNewItems.map(buildRssFeedItems));
  const rssFeedItems = feedsWithRssFeedItems.flatMap((items) => items).filter(dedupeRssItems());

  const feedItems = rssFeedItems.map(mapRssFeedItemToFeedItem);
  if (feedItems.length === 0) {
    return {
      newFeedItems: 0,
    };
  }

  await feedItemBulkInsert(feedItems);
  await updateFeedStatsLastLoad();

  return {
    newFeedItems: feedItems.length,
  };
}
