import {emailItem} from 'database';
import {getDb} from '../db';
import type {CreateEmailItemInput, EmailItem} from '../types';

export async function createEmailItem(input: CreateEmailItemInput): Promise<EmailItem | null> {
  const db = getDb();

  const [created] = await db
    .insert(emailItem)
    .values({
      emailMessageId: input.emailMessageId,
      emailFrom: input.emailFrom,
      link: input.link,
      title: input.title,
      description: input.description,
    })
    .onConflictDoNothing({
      target: [emailItem.emailMessageId, emailItem.link],
    })
    .returning();

  return created ?? null;
}
