import {markFeedItemsAsRead, updateFeedStatsLastLoad} from 'domain/schwankie';

export async function markAsRead(mostRecentId: number) {
  await markFeedItemsAsRead(mostRecentId);
  await updateFeedStatsLastLoad();
}
