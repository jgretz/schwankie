import {apiFetch} from '../config';
import type {GmailConnectionTestResult} from '../types';

export async function testGmailConnection(): Promise<GmailConnectionTestResult> {
  return apiFetch<GmailConnectionTestResult>('/api/gmail/test', {
    method: 'POST',
  });
}
