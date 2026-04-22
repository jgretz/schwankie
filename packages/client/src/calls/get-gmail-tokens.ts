import {apiFetch} from '../config';
import type {GmailTokensResponse} from '../types';

export async function getGmailTokens(): Promise<GmailTokensResponse | null> {
  try {
    return await apiFetch<GmailTokensResponse>('/api/gmail/tokens');
  } catch (error) {
    if (error instanceof Error && error.message.includes('API error: 404')) {
      return null;
    }
    if (error instanceof Error && error.message.includes('API error: 410')) {
      return null;
    }
    throw error;
  }
}
