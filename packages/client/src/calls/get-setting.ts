import {apiFetch} from '../config';
import type {SettingResponse} from '../types';

export async function getSetting(key: string): Promise<SettingResponse | null> {
  try {
    return await apiFetch<SettingResponse>(`/api/settings/${key}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('API error: 404')) return null;
    throw error;
  }
}
