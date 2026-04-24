import {apiFetch} from '../config';
import type {StatusResponse} from '../types';

export async function getStatus(): Promise<StatusResponse> {
  return apiFetch<StatusResponse>('/api/status');
}
