import {apiFetch} from '../config';
import type {SettingResponse} from '../types';

export async function getSetting(key: string): Promise<SettingResponse> {
  return apiFetch<SettingResponse>(`/api/settings/${key}`);
}
