import {useQuery} from '@tanstack/react-query';
import {listDailySummaryDatesAction} from '@www/lib/daily-summary-actions';

export function useDailySummaryDates() {
  return useQuery({
    queryKey: ['daily-summary-dates'],
    queryFn: () => listDailySummaryDatesAction(),
    select: (data) => data.dates,
  });
}
