import {getConfig} from '../config';
import type {GmailTokensResponse} from '../types';

export async function getGmailTokens(): Promise<GmailTokensResponse | null> {
  const config = getConfig();
  if (!config) throw new Error('Client not initialized');

  const response = await fetch(`${config.apiUrl}/api/gmail/tokens`, {
    headers: {'Authorization': `Bearer ${config.apiKey || ''}`},
  });

  if (response.status === 404 || response.status === 410) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `HTTP ${response.status}: ${text || 'Unknown error'}`,
    );
  }

  return response.json() as Promise<GmailTokensResponse>;
}
