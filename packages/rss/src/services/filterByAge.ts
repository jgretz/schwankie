import type Parser from 'rss-parser';
import type {ParseRssFeed, ParseRssItem} from '../Types';

const MAX_AGE = 1000 * 60 * 60 * 24 * 30; // 30 days

export function filterByAge(feed: Parser.Output<ParseRssItem>) {
  const items = feed.items.filter((item) => {
    const age = Date.now() - new Date(item.pubDate).getTime();
    return age <= MAX_AGE;
  });

  return {
    ...feed,
    items,
  } as ParseRssFeed & Parser.Output<ParseRssItem>;
}
