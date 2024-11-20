import type {FeedItem} from 'domain/feeds';
import type {RssFeedItem} from '../../Types';

export function mapRssFeedItemToFeedItem(rssFeedItem: RssFeedItem): FeedItem {
  const content = JSON.stringify({
    feed: rssFeedItem.feed,
    title: rssFeedItem.title,
    summary: rssFeedItem.summary,
    link: rssFeedItem.link,
    image: rssFeedItem.image,
    pubDate: rssFeedItem.pubDate,
  });

  return {
    feedId: rssFeedItem.feedId,
    guid: rssFeedItem.guid,
    read: false,
    content,
    createDate: new Date(rssFeedItem.pubDate),
    updateDate: new Date(rssFeedItem.pubDate),
  } as FeedItem;
}
