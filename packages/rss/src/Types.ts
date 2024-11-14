export interface RssFeedItem {
  id?: number;
  feedId: number;
  feed: string;
  guid: string;
  title: string;
  summary?: string;
  link: string;
  image?: string;
  pubDate: string;
  read?: boolean;
}

// JSON Content Field
export interface FeedItemContent {
  feed: string;
  title: string;
  summary?: string;
  link: string;
  image?: string;
  pubDate: string;
}

// Parsing
type StandardFeed = {
  feedId: number;
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

type SlashdotItem = {
  creator: string;
  'dc:date': string;
};

type HackerNewsItem = {
  comments: string;
};

type GuidFromIdItem = {
  id: string;
};

export type ParseRssFeed = StandardFeed;
export type ParseRssItem = StandardItem & SlashdotItem & HackerNewsItem & GuidFromIdItem;
