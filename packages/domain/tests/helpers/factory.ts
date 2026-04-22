import {createLink} from '../../src/commands/create-link';
import {createEmailItem} from '../../src/commands/create-email-item';
import type {CreateLinkInput, CreateEmailItemInput} from '../../src/types';

export async function makeLink(overrides: Partial<CreateLinkInput> = {}) {
  const input: CreateLinkInput = {
    url: `https://test-${Date.now()}-${Math.random().toString(36).slice(2)}.com`,
    title: 'Test Link',
    ...overrides,
  };

  return createLink(input);
}

export async function makeEmailItem(overrides: Partial<CreateEmailItemInput> = {}) {
  const input: CreateEmailItemInput = {
    emailMessageId: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    emailFrom: 'test@example.com',
    link: `https://test-${Date.now()}-${Math.random().toString(36).slice(2)}.com`,
    ...overrides,
  };

  return createEmailItem(input);
}
