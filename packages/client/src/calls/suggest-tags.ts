import {apiFetch} from '../config';

export function suggestTags(id: number): Promise<{tags: string[]}> {
  return apiFetch(`/api/links/${id}/suggest-tags`, {method: 'POST'});
}
