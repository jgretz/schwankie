import {markFeedItemAsClicked} from 'domain/feeds';

export async function markAsClicked(id: number) {
  return await markFeedItemAsClicked(id);
}
