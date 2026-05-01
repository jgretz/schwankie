import {apiFetch} from '../config';
import type {RunnerData} from '../types';

export async function listRunners(): Promise<RunnerData[]> {
  return apiFetch<RunnerData[]>('/api/runners');
}
