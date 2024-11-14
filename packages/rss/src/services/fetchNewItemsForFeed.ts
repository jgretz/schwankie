import type {Feed} from 'domain/schwankie';
import {fetchRssFeed} from './fetchRssFeed';
import {filterByAge} from './filterByAge';
import {filterOutExistingItems} from './filterOutExistingItems';

export async function fetchNewItemsForFeeds(feeds: Feed[]) {
  const feedsWithOnlyNewItems = [];
  for (const feed of feeds) {
    const newItems = await fetchNewItemsForFeed(feed);
    feedsWithOnlyNewItems.push(newItems);
  }

  return feedsWithOnlyNewItems;
}

export async function fetchNewItemsForFeed(feed: Feed) {
  const raw = await fetchRssFeed(feed);
  const recent = filterByAge(raw);
  const onlyNew = await filterOutExistingItems(recent);

  return onlyNew;
}
