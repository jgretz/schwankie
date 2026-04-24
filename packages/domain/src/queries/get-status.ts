import {and, count, desc, eq, gt, gte, sql} from 'drizzle-orm';
import {emailItem, feed, rssItem, setting} from 'database';
import {getDb} from '../db';

export type StatusBucket = {hour: string; count: number};

export type FailingFeed = {
  id: string;
  name: string;
  errorCount: number;
  lastError: string | null;
};

export type StatusSummary = {
  fetchedAt: string;
  heartbeat: {lastAt: string | null};
  email: {
    lastImportedAt: string | null;
    recentCount: number;
    hourly: StatusBucket[];
  };
  feeds: {
    lastScheduledAt: string | null;
    enabledCount: number;
    disabledCount: number;
    failingCount: number;
    failing: FailingFeed[];
    recentCount: number;
    hourly: StatusBucket[];
  };
};

const SETTING_KEYS = [
  'tasks_heartbeat_at',
  'gmail_last_imported_at',
  'tasks_feed_schedule_last_at',
] as const;

type SettingKey = (typeof SETTING_KEYS)[number];

async function loadSettings(db: ReturnType<typeof getDb>): Promise<Record<SettingKey, string | null>> {
  const rows = await db
    .select({key: setting.key, value: setting.value})
    .from(setting)
    .where(sql`${setting.key} IN (${sql.join(SETTING_KEYS.map((k) => sql`${k}`), sql`, `)})`);

  const out: Record<SettingKey, string | null> = {
    tasks_heartbeat_at: null,
    gmail_last_imported_at: null,
    tasks_feed_schedule_last_at: null,
  };
  for (const row of rows) {
    if ((SETTING_KEYS as readonly string[]).includes(row.key)) {
      out[row.key as SettingKey] = row.value;
    }
  }
  return out;
}

function hoursAgo(n: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function normalizeBuckets(rows: Array<{hour: Date | string; count: number}>): StatusBucket[] {
  return rows.map((r) => ({
    hour: r.hour instanceof Date ? r.hour.toISOString() : new Date(r.hour).toISOString(),
    count: Number(r.count),
  }));
}

export async function getStatus(): Promise<StatusSummary> {
  const db = getDb();
  const since24h = hoursAgo(24);
  const since7d = daysAgo(7);

  const [settings, emailRecent, emailHourlyRaw, feedCounts, failing, rssRecent, rssHourlyRaw] =
    await Promise.all([
      loadSettings(db),
      db
        .select({count: count()})
        .from(emailItem)
        .where(gte(emailItem.importedAt, since7d)),
      db
        .select({
          hour: sql<Date>`date_trunc('hour', ${emailItem.importedAt})`.as('hour'),
          count: count(),
        })
        .from(emailItem)
        .where(gte(emailItem.importedAt, since24h))
        .groupBy(sql`date_trunc('hour', ${emailItem.importedAt})`)
        .orderBy(sql`date_trunc('hour', ${emailItem.importedAt})`),
      db
        .select({
          disabled: feed.disabled,
          count: count(),
        })
        .from(feed)
        .groupBy(feed.disabled),
      db
        .select({
          id: feed.id,
          name: feed.name,
          errorCount: feed.errorCount,
          lastError: feed.lastError,
        })
        .from(feed)
        .where(and(eq(feed.disabled, false), gt(feed.errorCount, 0)))
        .orderBy(desc(feed.errorCount))
        .limit(10),
      db
        .select({count: count()})
        .from(rssItem)
        .where(gte(rssItem.createdAt, since24h)),
      db
        .select({
          hour: sql<Date>`date_trunc('hour', ${rssItem.createdAt})`.as('hour'),
          count: count(),
        })
        .from(rssItem)
        .where(gte(rssItem.createdAt, since24h))
        .groupBy(sql`date_trunc('hour', ${rssItem.createdAt})`)
        .orderBy(sql`date_trunc('hour', ${rssItem.createdAt})`),
    ]);

  const enabledCount = feedCounts.find((r) => r.disabled === false)?.count ?? 0;
  const disabledCount = feedCounts.find((r) => r.disabled === true)?.count ?? 0;

  return {
    fetchedAt: new Date().toISOString(),
    heartbeat: {lastAt: settings.tasks_heartbeat_at},
    email: {
      lastImportedAt: settings.gmail_last_imported_at,
      recentCount: emailRecent[0]?.count ?? 0,
      hourly: normalizeBuckets(emailHourlyRaw),
    },
    feeds: {
      lastScheduledAt: settings.tasks_feed_schedule_last_at,
      enabledCount: Number(enabledCount),
      disabledCount: Number(disabledCount),
      failingCount: failing.length,
      failing,
      recentCount: rssRecent[0]?.count ?? 0,
      hourly: normalizeBuckets(rssHourlyRaw),
    },
  };
}
