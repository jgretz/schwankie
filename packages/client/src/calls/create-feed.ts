import {apiFetch} from '../config';
import type {CreateFeedInput, FeedData} from '../types';

export function createFeed(input: CreateFeedInput): Promise<FeedData> {
  return apiFetch<FeedData>('/api/feeds', {method: 'POST', body: JSON.stringify(input)});
}
