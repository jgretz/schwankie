import type {FeedItem} from 'domain/schwankie';
import type {FeedItemContent, RssFeedItem} from '../../Types';

export function mapFeedItemToRssFeedItem(feedItem: FeedItem): RssFeedItem {
  const content = JSON.parse(feedItem.content as string) as FeedItemContent;

  return {
    ...content,

    feedId: feedItem.feedId,
    guid: feedItem.guid,
    read: feedItem.read,
  } as RssFeedItem;
}
