import {apiFetch} from '../config';
import type {DailySummaryData, UpsertDailySummaryInput} from '../types';

export function upsertDailySummary(data: UpsertDailySummaryInput): Promise<DailySummaryData> {
  return apiFetch<DailySummaryData>('/api/digest/daily-summary', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
