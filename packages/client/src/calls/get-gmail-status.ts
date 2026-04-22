import {apiFetch} from '../config';
import type {GmailStatusResponse} from '../types';

export async function getGmailStatus(): Promise<GmailStatusResponse> {
  return apiFetch<GmailStatusResponse>('/api/gmail/status');
}
