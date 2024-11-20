import {feedsQuery} from 'domain/feeds';
import {importLatestFromFeed} from './importLatestFromFeed';

export async function importLatestFromAllFeeds() {
  const feeds = await feedsQuery();
  let count = 0;

  for (const feed of feeds) {
    const result = await importLatestFromFeed(feed);
    count += result.importCount;
  }

  return {
    importCount: count,
  };
}
