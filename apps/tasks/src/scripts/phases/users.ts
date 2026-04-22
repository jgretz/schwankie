import postgres from 'postgres';
import {setGmailFilter} from 'client';

export interface PhaseResult {
  read: number;
  wrote: number;
  skipped: number;
  errors: Error[];
}

interface StashlUser {
  id: number;
  email_filter: string | null;
}

export async function migrateUsers(
  sql: postgres.Sql,
  userEmail: string,
  dryRun: boolean,
): Promise<PhaseResult> {
  const result: PhaseResult = {read: 0, wrote: 0, skipped: 0, errors: []};

  try {
    const users = await sql<StashlUser[]>`
      SELECT
        id,
        email_filter
      FROM users
      WHERE email = ${userEmail}
    `;

    result.read = users.length;

    for (const user of users) {
      try {
        if (dryRun) {
          result.skipped++;
          continue;
        }

        if (user.email_filter) {
          await setGmailFilter(user.email_filter);
          result.wrote++;
        }
      } catch (error) {
        result.errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error : new Error(String(error)));
  }

  return result;
}
