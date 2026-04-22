import {apiFetch} from '../config';
import type {GmailConnectResponse} from '../types';

export async function exchangeGmailCode(code: string): Promise<GmailConnectResponse> {
  return apiFetch<GmailConnectResponse>('/api/gmail/exchange-code', {
    method: 'POST',
    body: JSON.stringify({code}),
  });
}
