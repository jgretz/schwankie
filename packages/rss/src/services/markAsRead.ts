import {markFeedItemsAsRead, updateFeedStats} from 'domain/schwankie';

export async function markAsRead(mostRecentId: number) {
  await markFeedItemsAsRead(mostRecentId);
  await updateFeedStats();
}
