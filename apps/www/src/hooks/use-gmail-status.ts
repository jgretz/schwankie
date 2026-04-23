import {useQuery} from '@tanstack/react-query';
import {getGmailStatusAction} from '@www/lib/gmail-actions';

export function useGmailStatus() {
  return useQuery({
    queryKey: ['gmail-status'],
    queryFn: () => getGmailStatusAction(),
  });
}
