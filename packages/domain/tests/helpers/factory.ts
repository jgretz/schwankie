import {createLink} from '../../src/commands/create-link';
import type {CreateLinkInput} from '../../src/types';
import {trackLink, trackTag} from './setup';

export async function makeLink(overrides: Partial<CreateLinkInput> = {}) {
  const input: CreateLinkInput = {
    url: `https://test-${Date.now()}-${Math.random().toString(36).slice(2)}.com`,
    title: 'Test Link',
    ...overrides,
  };

  const result = await createLink(input);
  trackLink(result.id);
  for (const t of result.tags) {
    trackTag(t.id);
  }
  return result;
}
