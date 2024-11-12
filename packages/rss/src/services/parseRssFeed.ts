import {match} from 'ts-pattern';
import Parse from 'rss-parser';
import metascraper from 'metascraper';
import metascraperImage from 'metascraper-image';

import type {RssFeedItem} from '../Types';

type StandardFeed = {
  title: string;
  link: string;
  image?: {
    url: string;
  };
};

type StandardItem = {
  guid: string;
  title: string;
  link: string;
  pubDate: string;
  enclosure?: {
    url: string;
  };

  content: string;
  contentSnippet?: string;

  description?: string;
  summary?: string;
};

type Slashdot = {
  'dc:date': string;
};

type HackerNews = {
  comments: string;
};

type Feed = StandardFeed;
type Item = StandardItem & Slashdot & HackerNews;

function parseSlashdotItem(item: Item, feedItem: RssFeedItem): RssFeedItem {
  return {
    ...feedItem,
    pubDate: item['dc:date'],
    image: 'https://a.fsdn.com/sd/topics/topicslashdot.gif',
  };
}

function parseHackerNewsItem(item: Item, feedItem: RssFeedItem): RssFeedItem {
  return {
    ...feedItem,
    guid: item.comments,
  };
}

async function scrapeImage(html: string, url: string) {
  const scraper = metascraper([metascraperImage()]);
  const metadata = await scraper({html, url});

  return metadata.image;
}

async function parseImage(feed: Feed, item: Item) {
  // good feed gave us an image
  const image = item.enclosure?.url ?? feed.image?.url;
  if (image) {
    return image;
  }

  // Try to scrape the image from the content
  const sources = [item.content, item.contentSnippet, item.description, item.summary];
  for (let x = 0; x < sources.length; x++) {
    const html = sources[x];
    if (!html) {
      continue;
    }

    const imageUrl = await scrapeImage(html, item.link);
    if (imageUrl) {
      return imageUrl;
    }
  }

  return undefined;

  // Fallback to fetching the site
  // const siteResponse = await fetch(item.link);
  // const siteHtml = await siteResponse.text();
  // return await scrapeImage(siteHtml, item.link);
}

function isHTML(str: string): boolean {
  try {
    new DOMParser().parseFromString(str, 'text/html');

    return true;
  } catch (error) {
    return false;
  }
}

function parseSummary(item: Item) {
  const summary = item.description ?? item.summary;
  if (summary) {
    return summary;
  }

  if (item.contentSnippet && !isHTML(item.contentSnippet)) {
    return item.contentSnippet;
  }

  if (item.content && !isHTML(item.content)) {
    return item.content;
  }

  return undefined;
}

async function parseItem(feed: Feed, item: Item) {
  const image = await parseImage(feed, item);
  const summary = parseSummary(item);

  const standardItem = {
    feed: feed.title,
    guid: item.guid,
    title: item.title,
    link: item.link,
    pubDate: item.pubDate,
    summary,
    image,
    read: false,
  };

  return match(feed.title)
    .with('Slashdot', () => parseSlashdotItem(item, standardItem))
    .with('Hacker News', () => parseHackerNewsItem(item, standardItem))
    .otherwise(() => standardItem);
}

export async function parseRssFeed(feedUrl: string): Promise<RssFeedItem[]> {
  const parser = new Parse<Feed, Item>();
  try {
    const feed = await parser.parseURL(feedUrl);

    return await Promise.all(feed.items.map((item) => parseItem(feed, item)));
  } catch (error) {
    console.error(`Error parsing feed: ${feedUrl}`, error);
    return [];
  }
}
