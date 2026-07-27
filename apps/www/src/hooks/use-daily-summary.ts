import {useQuery} from '@tanstack/react-query';
import {getDailySummaryAction} from '@www/lib/daily-summary-actions';

export function useDailySummary(date?: string) {
  return useQuery({
    queryKey: ['daily-summary', date ?? 'latest'],
    queryFn: () => getDailySummaryAction({data: {date}}),
  });
}
