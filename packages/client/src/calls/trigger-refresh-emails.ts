import {apiFetch} from '../config';
import type {WorkRequestResponse} from '../types';

export function triggerRefreshEmails(): Promise<WorkRequestResponse> {
  return apiFetch<WorkRequestResponse>('/api/emails/refresh', {
    method: 'POST',
  });
}
