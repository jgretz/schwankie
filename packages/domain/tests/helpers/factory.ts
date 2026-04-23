import {createLink} from '../../src/commands/create-link';
import {createFeed} from '../../src/commands/create-feed';
import {createRssItem} from '../../src/commands/create-rss-item';
import {createEmailItem} from '../../src/commands/create-email-item';
import {createWorkRequest} from '../../src/commands/create-work-request';
import type {
  CreateLinkInput,
  CreateFeedInput,
  CreateRssItemInput,
  CreateEmailItemInput,
  CreateWorkRequestInput,
} from '../../src/types';

export async function makeLink(overrides: Partial<CreateLinkInput> = {}) {
  const input: CreateLinkInput = {
    url: `https://test-${Date.now()}-${Math.random().toString(36).slice(2)}.com`,
    title: 'Test Link',
    ...overrides,
  };

  return createLink(input);
}

export async function makeFeed(overrides: Partial<CreateFeedInput> = {}) {
  const input: CreateFeedInput = {
    name: `Test Feed ${Date.now()}`,
    sourceUrl: `https://test-feed-${Date.now()}-${Math.random().toString(36).slice(2)}.com/feed.xml`,
    ...overrides,
  };

  return createFeed(input);
}

export async function makeRssItem(feedId: string, overrides: Partial<CreateRssItemInput> = {}) {
  const input: CreateRssItemInput = {
    feedId,
    guid: `test-guid-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: 'Test RSS Item',
    link: `https://test-${Date.now()}.com/article`,
    ...overrides,
  };

  return createRssItem(input);
}

let emailItemTimestamp = Date.now();

export async function makeEmailItem(overrides: Partial<CreateEmailItemInput> = {}) {
  const timestamp = new Date(emailItemTimestamp);
  emailItemTimestamp += 1000;

  const input: CreateEmailItemInput = {
    emailMessageId: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    emailFrom: 'test@example.com',
    link: `https://test-${Date.now()}-${Math.random().toString(36).slice(2)}.com`,
    importedAt: timestamp,
    ...overrides,
  };

  return createEmailItem(input);
}

export function resetEmailItemTimestamp() {
  emailItemTimestamp = Date.now();
}

export async function makeWorkRequest(overrides: Partial<CreateWorkRequestInput> = {}) {
  const input: CreateWorkRequestInput = {
    type: 'refresh-all-feeds',
    ...overrides,
  };

  return createWorkRequest(input);
}
