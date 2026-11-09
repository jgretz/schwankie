import {apiFetch} from '../config';
import type {MarkDailySummaryItemsReadResult} from '../types';

export function markDailySummaryItemsRead(date: string): Promise<MarkDailySummaryItemsReadResult> {
  return apiFetch<MarkDailySummaryItemsReadResult>('/api/digest/daily-summary/mark-read', {
    method: 'POST',
    body: JSON.stringify({date}),
  });
}
