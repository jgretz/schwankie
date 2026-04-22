import {apiFetch} from '../config';

export async function disconnectGmail(): Promise<{disconnected: boolean}> {
  return apiFetch<{disconnected: boolean}>('/api/gmail/disconnect', {
    method: 'POST',
  });
}
