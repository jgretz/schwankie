import Parse from 'rss-parser';
import type {ParseRssFeed, ParseRssItem} from '../Types';
import {PreProcessParseRssItem} from './preProcessParseRssItem';
import type {Feed} from 'domain/schwankie';

export async function fetchRssFeed(feed: Feed) {
  const parser = new Parse<ParseRssFeed, ParseRssItem>();
  try {
    const rssFeed = await parser.parseURL(feed.feedUrl);
    const items = rssFeed.items.map((item) => PreProcessParseRssItem(rssFeed, item));

    return {
      ...rssFeed,
      feedId: feed.id,
      items,
    } as ParseRssFeed & Parse.Output<ParseRssItem>;
  } catch (error) {
    console.error(`Error parsing feed: ${feed.feedUrl}`, error);
    return {feed: {}, items: []} as unknown as ParseRssFeed & Parse.Output<ParseRssItem>;
  }
}
