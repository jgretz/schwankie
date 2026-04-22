import {apiFetch} from '../config';
import type {FeedData} from '../types';

export function fetchAllFeeds(): Promise<FeedData[]> {
  return apiFetch<FeedData[]>('/api/feeds/all');
}
