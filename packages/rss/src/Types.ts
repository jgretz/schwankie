export interface RssFeedItem {
  feed: string;
  guid: string;
  title: string;
  summary?: string;
  link: string;
  image?: string;
  pubDate: string;
  read?: boolean;
}
