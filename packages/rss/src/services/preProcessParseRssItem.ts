import {match} from 'ts-pattern';
import type {ParseRssFeed, ParseRssItem} from '../Types';

function parseSlashdotDetails(item: ParseRssItem) {
  return {
    guid: `${item.creator}-${item['dc:date']}`,
    pubDate: item['dc:date'],
    image: {
      url: 'https://a.fsdn.com/sd/topics/topicslashdot.gif',
    },
  };
}

function parseHackerNewsDetails(item: ParseRssItem) {
  return {
    guid: item.comments,
  };
}
function parseGuidFromId(item: ParseRssItem) {
  return {
    guid: item.id,
  };
}

export function PreProcessParseRssItem(feed: ParseRssFeed, item: ParseRssItem) {
  const custom = match(feed.title)
    .with('Slashdot', () => parseSlashdotDetails(item))
    .with('Hacker News', () => parseHackerNewsDetails(item))
    .with('Julia Evans', () => parseGuidFromId(item))
    .with('The Verge -  All Posts', () => parseGuidFromId(item))
    .with('Martin Fowler', () => parseGuidFromId(item))
    .with('null program', () => parseGuidFromId(item))
    .otherwise(() => {});

  return {
    ...item,
    ...custom,
  };
}
