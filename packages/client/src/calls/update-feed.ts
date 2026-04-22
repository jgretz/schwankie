import {apiFetch} from '../config';
import type {UpdateFeedInput, FeedData} from '../types';

export function updateFeed(id: string, input: UpdateFeedInput): Promise<FeedData> {
  return apiFetch<FeedData>(`/api/feeds/${id}`, {method: 'PATCH', body: JSON.stringify(input)});
}
