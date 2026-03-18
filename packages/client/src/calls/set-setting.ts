import {apiFetch} from '../config';
import type {SettingResponse} from '../types';

export async function setSetting(
  key: string,
  value: string
): Promise<SettingResponse> {
  return apiFetch<SettingResponse>(`/api/settings/${key}`, {
    method: 'PUT',
    body: JSON.stringify({value}),
  });
}
