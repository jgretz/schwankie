import {useQuery} from '@tanstack/react-query';
import {getGmailStatus} from 'client';

export function useGmailStatus() {
  return useQuery({
    queryKey: ['gmail-status'],
    queryFn: () => getGmailStatus(),
  });
}
