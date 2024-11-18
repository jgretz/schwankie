import {markFeedItemAsClicked} from 'domain/schwankie';

export async function markAsClicked(id: number) {
  return await markFeedItemAsClicked(id);
}
