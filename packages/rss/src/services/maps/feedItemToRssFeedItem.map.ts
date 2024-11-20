import type {FeedItem} from 'domain/feeds';
import type {FeedItemContent, RssFeedItem} from '../../Types';

export function mapFeedItemToRssFeedItem(feedItem: FeedItem): RssFeedItem {
  const content = JSON.parse(feedItem.content as string) as FeedItemContent;

  return {
    ...content,

    id: feedItem.id,
    feedId: feedItem.feedId,
    guid: feedItem.guid,
    read: feedItem.read,
  } as RssFeedItem;
}
