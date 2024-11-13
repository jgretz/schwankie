import type Parser from 'rss-parser';
import type {ParseRssFeed, ParseRssItem} from '../Types';
import {asyncParallelFilter} from 'utility-util';
import {feedItemByGuidQuery} from 'domain/schwankie';

export async function filterOutExistingItems(feed: Parser.Output<ParseRssItem>) {
  const items = await asyncParallelFilter(feed.items, async (item) => {
    if (!item.guid) {
      console.log('Item has no guid', feed.title, item);
    }

    const existing = await feedItemByGuidQuery({guid: item.guid});
    return !existing;
  });

  return {
    ...feed,
    items,
  } as ParseRssFeed & Parser.Output<ParseRssItem>;
}
