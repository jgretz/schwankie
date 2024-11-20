import {feedByIdQuery, feedImportHistoryInsert, feedItemBulkInsert, type Feed} from 'domain/feeds';
import {fetchNewItemsForFeed} from './fetchNewItemsForFeed';
import {buildRssFeedItem} from './buildRssFeedItem';
import {mapRssFeedItemToFeedItem} from '../maps/rssFeedItemToFeedItem.map';

export async function importLatestFromFeedById(feedId: number) {
  const feed = await feedByIdQuery({id: feedId});
  if (!feed) {
    throw new Error(`Feed not found: ${feedId}`);
  }

  return importLatestFromFeed(feed);
}

export async function importLatestFromFeed(feed: Feed) {
  console.time(`Import From Feed: ${feed.title}`);

  try {
    const feedWithNewItems = await fetchNewItemsForFeed(feed);
    const rssItems = await Promise.all(
      feedWithNewItems.items.map((item) => buildRssFeedItem(feedWithNewItems, item)),
    );

    const feedItems = rssItems.map(mapRssFeedItemToFeedItem);
    if (feedItems.length === 0) {
      return {
        importCount: 0,
      };
    }

    await feedItemBulkInsert(feedItems);
    await feedImportHistoryInsert({
      feedId: feed.id,
      importDate: new Date(),
      itemCount: feedItems.length,
    });

    return {
      importCount: feedItems.length,
    };
  } catch (error) {
    console.error(`Error importing feed: ${feed.title}`, error);
    throw error;
  } finally {
    console.timeEnd(`Import From Feed: ${feed.title}`);
  }
}
