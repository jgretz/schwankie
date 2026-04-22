import z from 'zod';
import {parseEnv} from 'env';
import {init} from 'client';
import {getStashlDb, closeStashlDb} from './stashl-db';
import {migrateUsers} from './phases/users';
import {migrateLinks} from './phases/links';
import {migrateFeeds} from './phases/feeds';
import {migrateRssItems} from './phases/rss-items';
import {migrateEmailItems} from './phases/email-items';

interface PhaseResult {
  read: number;
  wrote: number;
  skipped: number;
  errors: Error[];
}

const envSchema = z.object({
  STASHL_DATABASE_URL: z.string().url(),
  API_URL: z.string().url(),
  API_KEY: z.string(),
});

const USER_EMAIL = 'jgretz@gmail.com';

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  console.log(`Starting migration from stashl → schwankie (dry-run: ${dryRun})...`);
  console.log(`User email: ${USER_EMAIL}\n`);

  try {
    const env = parseEnv(envSchema);
    init({apiUrl: env.API_URL, apiKey: env.API_KEY});

    const sql = await getStashlDb(env.STASHL_DATABASE_URL);

    const userResult = await sql<Array<{id: number}>>`
      SELECT id FROM users WHERE email = ${USER_EMAIL}
    `;

    if (userResult.length === 0) {
      console.error(`Error: User not found with email: ${USER_EMAIL}`);
      process.exit(1);
    }

    const userId = userResult[0].id;
    console.log(`Resolved user ID: ${userId}\n`);

    const results = new Map<string, PhaseResult>();

    try {
      const usersResult = await migrateUsers(sql, USER_EMAIL, dryRun);
      results.set('users', usersResult);
      logPhaseResult('users', usersResult);
    } catch (error) {
      console.error('[users] Phase failed:', error);
    }

    try {
      const linksResult = await migrateLinks(sql, userId, dryRun);
      results.set('links', linksResult);
      logPhaseResult('links', linksResult);
    } catch (error) {
      console.error('[links] Phase failed:', error);
    }

    try {
      const {result: feedsResult, feedMap} = await migrateFeeds(sql, userId, dryRun);
      results.set('feeds', feedsResult);
      logPhaseResult('feeds', feedsResult);

      if (feedMap.size > 0) {
        try {
          const rssItemsResult = await migrateRssItems(sql, feedMap, dryRun);
          results.set('rss_items', rssItemsResult);
          logPhaseResult('rss_items', rssItemsResult);
        } catch (error) {
          console.error('[rss_items] Phase failed:', error);
        }
      } else {
        console.log('[rss_items] Skipped: no feeds to migrate\n');
      }
    } catch (error) {
      console.error('[feeds] Phase failed:', error);
    }

    try {
      const emailItemsResult = await migrateEmailItems(sql, userId, dryRun);
      results.set('email_items', emailItemsResult);
      logPhaseResult('email_items', emailItemsResult);
    } catch (error) {
      console.error('[email_items] Phase failed:', error);
    }

    await closeStashlDb();

    console.log('=== SUMMARY ===\n');
    let totalRead = 0;
    let totalWrote = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const result of results.values()) {
      totalRead += result.read;
      totalWrote += result.wrote;
      totalSkipped += result.skipped;
      totalErrors += result.errors.length;
    }

    const summaryTable = Array.from(results.entries())
      .map(([phaseName, result]) => ({
        Phase: phaseName,
        Read: result.read,
        Wrote: result.wrote,
        Skipped: result.skipped,
        Errors: result.errors.length,
      }))
      .sort((a, b) => a.Phase.localeCompare(b.Phase));

    console.table(summaryTable);

    console.log(`\nTotal: read=${totalRead}, wrote=${totalWrote}, skipped=${totalSkipped}, errors=${totalErrors}`);

    if (totalErrors > 0) {
      console.log('\nPhase errors:');
      for (const [phaseName, result] of results) {
        if (result.errors.length > 0) {
          console.log(`\n  [${phaseName}]`);
          for (const error of result.errors) {
            console.log(`    - ${error.message}`);
          }
        }
      }
    }

    const hasErrors = Array.from(results.values()).some((r) => r.errors.length > 0);
    const exitCode = hasErrors ? 1 : 0;
    console.log(`\nExit code: ${exitCode}`);
    process.exit(exitCode);
  } catch (error) {
    console.error('Fatal error:', error);
    await closeStashlDb();
    process.exit(1);
  }
}

function logPhaseResult(phase: string, result: PhaseResult): void {
  console.log(`[${phase}] read=${result.read}, wrote=${result.wrote}, skipped=${result.skipped}, errors=${result.errors.length}`);
}

main();
