import {markFeedItemsAsRead} from 'domain/feeds';

export async function markAsRead(mostRecentId: number) {
  await markFeedItemsAsRead(mostRecentId);
}
