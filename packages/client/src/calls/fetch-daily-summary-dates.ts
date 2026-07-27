import {apiFetch} from '../config';

export function fetchDailySummaryDates(): Promise<{dates: string[]}> {
  return apiFetch<{dates: string[]}>('/api/digest/daily-summary/dates');
}
