import {feed} from 'database';
import {eq} from 'drizzle-orm';
import {getDb} from '../db';
import type {UpdateFeedInput, Feed} from '../types';

export async function updateFeed(id: string, input: UpdateFeedInput): Promise<Feed | null> {
  const db = getDb();

  const updateValues = {
    ...(input.name !== undefined && {name: input.name}),
    ...(input.sourceUrl !== undefined && {sourceUrl: input.sourceUrl}),
    ...(input.lastFetchedAt !== undefined && {
      lastFetchedAt: input.lastFetchedAt ? new Date(input.lastFetchedAt) : null,
    }),
    ...(input.errorCount !== undefined && {errorCount: input.errorCount}),
    ...(input.lastError !== undefined && {lastError: input.lastError}),
    ...(input.disabled !== undefined && {disabled: input.disabled}),
    updatedAt: new Date(),
  };

  const [updated] = await db
    .update(feed)
    .set(updateValues)
    .where(eq(feed.id, id))
    .returning();

  return updated || null;
}
