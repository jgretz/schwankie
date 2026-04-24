import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {
  createFeedAction,
  deleteFeedAction,
  fetchFeedsAction,
  updateFeedAction,
} from '@www/lib/feed-actions';

export function useFeeds() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['feeds'],
    queryFn: () => fetchFeedsAction(),
  });

  const createMutation = useMutation({
    mutationFn: ({name, sourceUrl}: {name: string; sourceUrl: string}) =>
      createFeedAction({data: {name, sourceUrl}}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['feeds']});
    },
    onError: (error) => {
      console.error('Failed to create feed:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({id, name, sourceUrl, disabled}: {id: string; name?: string; sourceUrl?: string; disabled?: boolean}) =>
      updateFeedAction({data: {id, name, sourceUrl, disabled}}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['feeds']});
    },
    onError: (error) => {
      console.error('Failed to update feed:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFeedAction({data: {id}}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['feeds']});
    },
    onError: (error) => {
      console.error('Failed to delete feed:', error);
    },
  });

  return {
    query,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
