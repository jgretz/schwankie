import {apiFetch} from '../config';
import type {GmailAuthUrlResponse} from '../types';

export async function getGmailAuthUrl(): Promise<GmailAuthUrlResponse> {
  return apiFetch<GmailAuthUrlResponse>('/api/gmail/auth-url');
}
