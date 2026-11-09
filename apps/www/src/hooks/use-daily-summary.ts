import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  getDailySummaryAction,
  markDailySummaryItemsReadAction,
} from '@www/lib/daily-summary-actions';

export function useDailySummary(date?: string) {
  return useQuery({
    queryKey: ['daily-summary', date ?? 'latest'],
    queryFn: () => getDailySummaryAction({data: {date}}),
  });
}

export function useMarkDailySummaryItemsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date: string) => markDailySummaryItemsReadAction({data: {date}}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['all-rss-items']});
      queryClient.invalidateQueries({queryKey: ['rss-items']});
      queryClient.invalidateQueries({queryKey: ['email-items']});
    },
  });
}
