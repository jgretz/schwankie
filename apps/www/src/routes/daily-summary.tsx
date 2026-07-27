import {createFileRoute, redirect, useNavigate} from '@tanstack/react-router';
import {useCallback, useMemo} from 'react';
import {z} from 'zod';
import type {DigestTopic} from 'client';
import {useDailySummary} from '@www/hooks/use-daily-summary';
import {useDailySummaryDates} from '@www/hooks/use-daily-summary-dates';

const searchSchema = z.object({
  date: z.string().optional().catch(undefined),
});

export const Route = createFileRoute('/daily-summary')({
  beforeLoad: ({context}) => {
    if (!context.auth.authenticated) {
      throw redirect({to: '/auth/login', search: {error: undefined}});
    }
  },
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      {title: 'Daily — schwankie'},
      {name: 'description', content: 'What came in over the last day, clustered into topics.'},
    ],
  }),
  component: DailySummaryPage,
});

function formatDate(date: string): string {
  // The stored date is already a local calendar date; parse it as one rather
  // than letting Date treat the bare string as UTC and shift it a day.
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return date;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function DailySummaryPage() {
  const {date} = Route.useSearch();
  const navigate = useNavigate({from: '/daily-summary'});

  const {data: summary, isLoading, error} = useDailySummary(date);
  const {data: dates} = useDailySummaryDates();

  // Which day we are actually looking at — the row's own date once loaded,
  // so prev/next work even when the page opened without a ?date.
  const activeDate = summary?.summaryDate ?? date;

  const {previousDate, nextDate} = useMemo(() => {
    if (!dates || !activeDate) return {previousDate: undefined, nextDate: undefined};
    const index = dates.indexOf(activeDate);
    if (index === -1) return {previousDate: undefined, nextDate: undefined};
    // `dates` is newest-first.
    return {previousDate: dates[index + 1], nextDate: dates[index - 1]};
  }, [dates, activeDate]);

  const goTo = useCallback(
    (target: string | undefined) => {
      if (!target) return;
      navigate({search: {date: target}});
    },
    [navigate],
  );

  if (isLoading) {
    return (
      <div className="px-6 py-6">
        <p className="font-sans text-[0.9rem] text-text-muted">Loading digest…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-6">
        <p className="font-sans text-[0.9rem] text-destructive">Failed to load the digest.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[760px] px-6 py-6">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="font-serif text-[1.35rem] font-semibold text-text">Daily</h2>
          {summary ? (
            <p className="mt-1 font-sans text-[0.8rem] text-text-faint">
              {formatDate(summary.summaryDate)} · {summary.itemCount}{' '}
              {summary.itemCount === 1 ? 'link' : 'links'} over {summary.lookbackHours}h
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => goTo(previousDate)}
            disabled={!previousDate}
            className="rounded border border-border px-2 py-1 font-sans text-[0.8rem] text-text-muted transition-colors hover:border-accent hover:text-text disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text-muted"
            aria-label="Previous digest"
          >
            ← Older
          </button>
          <button
            type="button"
            onClick={() => goTo(nextDate)}
            disabled={!nextDate}
            className="rounded border border-border px-2 py-1 font-sans text-[0.8rem] text-text-muted transition-colors hover:border-accent hover:text-text disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text-muted"
            aria-label="Next digest"
          >
            Newer →
          </button>
        </div>
      </div>

      {!summary ? (
        <p className="font-sans text-[0.9rem] text-text-muted">
          No digest for this day yet. The first one lands at 7am.
        </p>
      ) : (
        <>
          {summary.notable ? (
            <p className="mb-6 border-l-2 border-accent pl-4 font-sans text-[0.95rem] leading-relaxed text-text-muted">
              {summary.notable}
            </p>
          ) : null}

          {summary.topics.length === 0 ? (
            <p className="font-sans text-[0.9rem] text-text-muted">
              Nothing notable came in over this window.
            </p>
          ) : (
            <div className="space-y-4">
              {summary.topics.map((topic) => (
                <TopicCard key={topic.rank} topic={topic} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TopicCard({topic}: {topic: DigestTopic}) {
  return (
    <article className="rounded-lg border border-border p-5">
      <div className="mb-1 flex items-baseline gap-3">
        <h3 className="font-serif text-lg text-text">{topic.title}</h3>
        <span className="shrink-0 font-sans text-[0.75rem] text-text-faint">
          {topic.itemCount} {topic.itemCount === 1 ? 'link' : 'links'}
        </span>
      </div>

      <p className="font-sans text-[0.85rem] leading-relaxed text-text-muted">{topic.body}</p>

      {topic.links.length > 0 ? (
        <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
          {topic.links.map((link) => (
            <li key={link.url} className="flex items-baseline gap-2">
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="font-sans text-[0.85rem] text-text underline-offset-2 hover:text-accent hover:underline"
              >
                {link.title}
              </a>
              <span className="shrink-0 font-sans text-[0.7rem] text-text-faint">
                {link.source}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
