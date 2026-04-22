import {apiFetch} from '../config';
import type {FeedData} from '../types';

export function fetchFeeds(): Promise<FeedData[]> {
  return apiFetch<FeedData[]>('/api/feeds');
}
