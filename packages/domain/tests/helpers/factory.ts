import {createLink} from '../../src/commands/create-link';
import type {CreateLinkInput} from '../../src/types';

export async function makeLink(overrides: Partial<CreateLinkInput> = {}) {
  const input: CreateLinkInput = {
    url: `https://test-${Date.now()}-${Math.random().toString(36).slice(2)}.com`,
    title: 'Test Link',
    ...overrides,
  };

  return createLink(input);
}
