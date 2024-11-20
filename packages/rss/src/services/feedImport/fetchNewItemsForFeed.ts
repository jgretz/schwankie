import type {Feed} from 'domain/feeds';
import {fetchRssFeed} from './fetchRssFeed';
import {filterByAge} from './filterByAge';
import {filterOutExistingItems} from './filterOutExistingItems';

export async function fetchNewItemsForFeed(feed: Feed) {
  const raw = await fetchRssFeed(feed);
  const recent = filterByAge(raw);
  const onlyNew = await filterOutExistingItems(recent);

  return onlyNew;
}
