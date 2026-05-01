import {createFileRoute, Link} from '@tanstack/react-router';
import {useMemo} from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useStatus} from '@www/hooks/use-status';
import {useRunners} from '@www/hooks/use-runners';
import {deleteRunnerAction} from '@www/lib/status-actions';
import type {RunnerData, RunnerStatus, StatusBucket} from 'client';

export const Route = createFileRoute('/admin/status')({
  head: () => ({meta: [{title: 'Status — schwankie'}]}),
  component: AdminStatusPage,
});

const EMAIL_INTERVAL_MIN = 60;
const FEED_SCHEDULE_INTERVAL_MIN = 30;

type Health = 'green' | 'yellow' | 'red' | 'gray';

function ageMinutes(iso: string | null, now: number): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.round((now - then) / 60_000));
}

function classifyAge(ageMin: number | null, intervalMin: number): Health {
  if (ageMin === null) return 'gray';
  if (ageMin <= intervalMin * 2) return 'green';
  if (ageMin <= intervalMin * 4) return 'yellow';
  return 'red';
}

function formatAge(ageMin: number | null): string {
  if (ageMin === null) return 'never';
  if (ageMin < 1) return 'just now';
  if (ageMin < 60) return `${ageMin}m ago`;
  const hours = Math.floor(ageMin / 60);
  if (hours < 24) return `${hours}h ${ageMin % 60}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h ago`;
}

function formatSeconds(s: number): string {
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m ago`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h ago`;
}

function formatUptime(startedAt: string, now: number): string {
  const ms = now - new Date(startedAt).getTime();
  if (Number.isNaN(ms) || ms < 0) return 'just started';
  const totalS = Math.floor(ms / 1000);
  if (totalS < 60) return `${totalS}s`;
  const m = Math.floor(totalS / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

const DOT_COLOR: Record<Health, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  gray: 'bg-text-faint',
};

const HEALTH_LABEL: Record<Health, string> = {
  green: 'Healthy',
  yellow: 'Delayed',
  red: 'Stale',
  gray: 'Unknown',
};

const RUNNER_HEALTH: Record<RunnerStatus, Health> = {
  healthy: 'green',
  stale: 'yellow',
  dead: 'red',
};

function HealthDot({health}: {health: Health}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${DOT_COLOR[health]}`} aria-hidden />
      <span className="font-sans text-[0.8rem] text-text-muted">{HEALTH_LABEL[health]}</span>
    </span>
  );
}

function Sparkline({buckets, hours = 24}: {buckets: StatusBucket[]; hours?: number}) {
  const filled = useMemo(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const byIso = new Map(
      buckets.map((b) => {
        const d = new Date(b.hour);
        d.setMinutes(0, 0, 0);
        return [d.toISOString(), b.count] as const;
      }),
    );
    const out: {hour: Date; count: number}[] = [];
    for (let i = hours - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(d.getHours() - i);
      out.push({hour: d, count: byIso.get(d.toISOString()) ?? 0});
    }
    return out;
  }, [buckets, hours]);

  const max = Math.max(1, ...filled.map((b) => b.count));
  const total = filled.reduce((sum, b) => sum + b.count, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-[2px] h-14" aria-hidden>
        {filled.map((b, i) => {
          const heightPct = (b.count / max) * 100;
          return (
            <div
              key={i}
              className="flex-1 bg-accent/70 rounded-sm"
              style={{height: `${Math.max(heightPct, b.count > 0 ? 6 : 2)}%`, minHeight: '2px'}}
              title={`${b.hour.toLocaleTimeString([], {hour: 'numeric'})}: ${b.count}`}
            />
          );
        })}
      </div>
      <p className="font-sans text-[0.8rem] text-text-muted">
        {total} in last {hours}h · peak {max}/hr
      </p>
    </div>
  );
}

function StatusCard({
  title,
  health,
  ageText,
  lastAt,
  children,
}: {
  title: string;
  health: Health;
  ageText: string;
  lastAt: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-lg p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg text-text">{title}</h3>
          <p className="font-sans text-[0.85rem] text-text-muted mt-1">
            Last run: <span className="text-text">{ageText}</span>
            {lastAt && (
              <span className="text-text-faint"> · {new Date(lastAt).toLocaleString()}</span>
            )}
          </p>
        </div>
        <HealthDot health={health} />
      </div>
      {children}
    </div>
  );
}

function RunnerCard({runner, now}: {runner: RunnerData; now: number}) {
  const queryClient = useQueryClient();
  const removable = runner.status !== 'healthy';
  const health = RUNNER_HEALTH[runner.status];
  const shortId = `${runner.workerId.slice(0, 8)}…${runner.workerId.slice(-12)}`;
  const shortVersion = runner.version ? runner.version.slice(0, 7) : null;

  const remove = useMutation({
    mutationFn: () => deleteRunnerAction({data: {workerId: runner.workerId}}),
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['runners']}),
  });

  return (
    <div className="border border-border rounded-lg p-5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-serif text-lg text-text">
            <span className="font-mono text-base" title={runner.workerId}>
              {shortId}
            </span>
          </h3>
          <p className="font-sans text-[0.85rem] text-text-muted mt-1">
            <span className="text-text">{runner.hostname}</span>
            <span className="text-text-faint"> · pid {runner.pid}</span>
            {shortVersion && <span className="text-text-faint"> · {shortVersion}</span>}
          </p>
        </div>
        <HealthDot health={health} />
      </div>
      <div className="font-sans text-[0.85rem] text-text-muted">
        <p>
          Up <span className="text-text">{formatUptime(runner.startedAt, now)}</span>
        </p>
        <p>
          Heartbeat <span className="text-text">{formatSeconds(runner.ageSeconds)}</span>
        </p>
      </div>
      {removable && (
        <button
          type="button"
          onClick={() => remove.mutate()}
          disabled={remove.isPending}
          className="font-sans text-[0.8rem] text-text-muted hover:text-red-600 disabled:opacity-50 underline"
        >
          {remove.isPending ? 'Removing…' : 'Remove'}
        </button>
      )}
    </div>
  );
}

function RunnersSection() {
  const {data: runners, isLoading, error} = useRunners();
  const now = Date.now();

  if (isLoading) {
    return (
      <div className="mb-6">
        <h3 className="font-serif text-[1.1rem] font-semibold text-text mb-3">Runners</h3>
        <p className="font-sans text-[0.85rem] text-text-muted">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6">
        <h3 className="font-serif text-[1.1rem] font-semibold text-text mb-3">Runners</h3>
        <p className="font-sans text-[0.85rem] text-red-600">Failed to load runners</p>
      </div>
    );
  }

  const list = runners ?? [];

  return (
    <div className="mb-6">
      <h3 className="font-serif text-[1.1rem] font-semibold text-text mb-3">
        Runners ({list.length})
      </h3>
      {list.length === 0 ? (
        <p className="font-sans text-[0.85rem] text-text-muted">
          No runners registered. Start a tasks runner to see it here.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {list.map((runner) => (
            <RunnerCard key={runner.workerId} runner={runner} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}

function AdminStatusPage() {
  const {data, isLoading, error, dataUpdatedAt} = useStatus();

  if (isLoading) {
    return (
      <div className="px-6 py-6">
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-6 py-6">
        <p className="text-red-600">Failed to load status</p>
      </div>
    );
  }

  const now = Date.now();
  const emailAge = ageMinutes(data.email.lastImportedAt, now);
  const emailHealth = classifyAge(emailAge, EMAIL_INTERVAL_MIN);
  const feedScheduleAge = ageMinutes(data.feeds.lastScheduledAt, now);
  const feedHealth: Health = (() => {
    const scheduleHealth = classifyAge(feedScheduleAge, FEED_SCHEDULE_INTERVAL_MIN);
    if (data.feeds.failingCount > 0 && scheduleHealth === 'green') return 'yellow';
    return scheduleHealth;
  })();

  return (
    <div className="px-6 py-6">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-[1.35rem] font-semibold text-text">Status</h2>
        <p className="font-sans text-[0.8rem] text-text-faint">
          Updated {new Date(dataUpdatedAt).toLocaleTimeString()}
        </p>
      </div>

      <RunnersSection />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatusCard
          title="Email import"
          health={emailHealth}
          ageText={formatAge(emailAge)}
          lastAt={data.email.lastImportedAt}
        >
          <div className="space-y-3">
            <p className="font-sans text-[0.85rem] text-text-muted">
              Runs hourly. <span className="text-text font-semibold">{data.email.recentCount}</span>{' '}
              imported in the last 7 days.
            </p>
            <Sparkline buckets={data.email.hourly} />
          </div>
        </StatusCard>

        <StatusCard
          title="RSS feeds"
          health={feedHealth}
          ageText={formatAge(feedScheduleAge)}
          lastAt={data.feeds.lastScheduledAt}
        >
          <div className="space-y-3">
            <p className="font-sans text-[0.85rem] text-text-muted">
              Scheduled every {FEED_SCHEDULE_INTERVAL_MIN} min.{' '}
              <span className="text-text font-semibold">{data.feeds.enabledCount}</span> active
              {data.feeds.disabledCount > 0 && <> · {data.feeds.disabledCount} disabled</>}
              {data.feeds.failingCount > 0 && (
                <>
                  {' '}
                  ·{' '}
                  <span className="text-red-600 font-semibold">
                    {data.feeds.failingCount} failing
                  </span>
                </>
              )}
              .
            </p>
            <p className="font-sans text-[0.85rem] text-text-muted">
              <span className="text-text font-semibold">{data.feeds.recentCount}</span> items
              imported in last 24h.
            </p>
            <Sparkline buckets={data.feeds.hourly} />
          </div>
        </StatusCard>
      </div>

      {data.feeds.failing.length > 0 && (
        <div className="mt-6 border border-border rounded-lg p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="font-serif text-lg text-text">Failing feeds</h3>
            <Link
              to="/admin/feeds"
              className="font-sans text-[0.85rem] text-accent hover:underline"
            >
              Manage feeds →
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {data.feeds.failing.map((f) => (
              <li key={f.id} className="py-3 flex items-start gap-3">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500 mt-2 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-[0.9rem] text-text">{f.name}</p>
                  {f.lastError && (
                    <p
                      className="font-sans text-[0.8rem] text-text-muted truncate"
                      title={f.lastError}
                    >
                      {f.lastError}
                    </p>
                  )}
                </div>
                <span className="font-sans text-[0.8rem] text-text-faint shrink-0">
                  {f.errorCount} {f.errorCount === 1 ? 'error' : 'errors'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
