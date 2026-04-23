import {apiFetch} from '../config';
import type {FeedData} from '../types';

export async function getFeed(id: string): Promise<FeedData | null> {
  try {
    return await apiFetch<FeedData>(`/api/feeds/${id}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('API error: 404')) return null;
    throw error;
  }
}
