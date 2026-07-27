import {promoteFailure} from 'database';
import {getDb} from '../db';
import type {PromoteFailure, RecordPromoteFailureInput} from '../types';

/**
 * Persist a failed promote. Deliberately transaction-free: the caller writes
 * this from outside the promote transaction, which has already rolled back by
 * the time the failure is known.
 */
export async function recordPromoteFailure(
  input: RecordPromoteFailureInput,
): Promise<PromoteFailure> {
  const db = getDb();

  const rows = await db
    .insert(promoteFailure)
    .values({
      source: input.source,
      sourceItemId: input.sourceItemId,
      url: input.url ?? null,
      title: input.title ?? null,
      errorMessage: input.errorMessage,
      errorCode: input.errorCode ?? null,
    })
    .returning();

  return rows[0]!;
}
