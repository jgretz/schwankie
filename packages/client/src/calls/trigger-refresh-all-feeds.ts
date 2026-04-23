import {apiFetch} from '../config';
import type {WorkRequestResponse} from '../types';

export function triggerRefreshAllFeeds(): Promise<WorkRequestResponse> {
  return apiFetch<WorkRequestResponse>('/api/feeds/refresh', {
    method: 'POST',
  });
}
