import {apiFetch} from '../config';
import type {DailySummaryData} from '../types';

type FetchDailySummaryParams = {
  /** Omit for the most recent digest. */
  date?: string;
};

export function fetchDailySummary(params: FetchDailySummaryParams = {}): Promise<DailySummaryData> {
  const search = new URLSearchParams();
  if (params.date) search.set('date', params.date);

  const qs = search.toString();
  return apiFetch<DailySummaryData>(`/api/digest/daily-summary${qs ? `?${qs}` : ''}`);
}
