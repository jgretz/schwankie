import {createFileRoute, redirect, useNavigate} from '@tanstack/react-router';
import {type FormEvent, useEffect, useState} from 'react';
import {toast} from 'sonner';
import {z} from 'zod';
import type {HistoryDays, HistoryMatch} from 'client';
import {HistoryResultRow} from '@www/components/history/history-result-row';
import {Button} from '@www/components/ui/button';
import {Input} from '@www/components/ui/input';
import {useHistorySearch} from '@www/hooks/use-history-search';
import {HISTORY_RANGES, parseHistoryDays} from '@www/lib/history-search';

const MIN_QUERY_CHARS = 3;
const MAX_QUERY_CHARS = 300;

const searchSchema = z.object({
  q: z.string().optional().catch(undefined),
  days: z.unknown().transform(parseHistoryDays),
});

export const Route = createFileRoute('/history')({
  beforeLoad: ({context}) => {
    if (!context.auth.authenticated) {
      throw redirect({to: '/auth/login', search: {error: undefined}});
    }
  },
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      {title: 'History — schwankie'},
      {name: 'description', content: 'Find something you read before from a rough description.'},
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const {q, days} = Route.useSearch();
  const navigate = useNavigate({from: '/history'});
  const [draft, setDraft] = useState(q ?? '');
  const [draftDays, setDraftDays] = useState<HistoryDays>(days);

  useEffect(() => {
    setDraft(q ?? '');
    setDraftDays(days);
  }, [q, days]);

  const {data, isFetching, error} = useHistorySearch(q, days);

  useEffect(() => {
    if (error) toast.error('History search failed');
  }, [error]);

  const trimmed = draft.trim();
  const canSubmit = trimmed.length >= MIN_QUERY_CHARS;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    navigate({search: {q: trimmed, days: draftDays}});
  }

  return (
    <div className="mx-auto max-w-[760px] px-6 py-6">
      <div className="mb-5">
        <h2 className="font-serif text-[1.35rem] font-semibold text-text">History</h2>
        <p className="mt-1 font-sans text-[0.8rem] text-text-faint">
          Find something you read in the RSS or Emails readers from a rough description.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-3">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Describe what you read"
          maxLength={MAX_QUERY_CHARS}
          aria-label="Describe what you read"
        />
        <div className="flex flex-wrap items-center gap-2">
          {HISTORY_RANGES.map((range) => (
            <Button
              key={range.days}
              type="button"
              size="sm"
              variant={range.days === draftDays ? 'default' : 'outline'}
              aria-pressed={range.days === draftDays}
              onClick={() => setDraftDays(range.days)}
              className="font-sans text-[0.8rem]"
            >
              {range.label}
            </Button>
          ))}
          <Button type="submit" size="sm" disabled={!canSubmit} className="ml-auto font-sans">
            Search
          </Button>
        </div>
      </form>

      <HistoryResults
        hasQuery={!!q}
        isFetching={isFetching}
        failed={!!error}
        judged={data?.judged}
        results={data?.results}
      />
    </div>
  );
}

type HistoryResultsProps = {
  hasQuery: boolean;
  isFetching: boolean;
  failed: boolean;
  judged: boolean | undefined;
  results: HistoryMatch[] | undefined;
};

function HistoryResults({hasQuery, isFetching, failed, judged, results}: HistoryResultsProps) {
  if (!hasQuery) {
    return (
      <p className="font-sans text-[0.9rem] text-text-muted">
        Describe the item and pick how far back to look.
      </p>
    );
  }

  if (isFetching) {
    return <p className="font-sans text-[0.9rem] text-text-muted">Searching your history…</p>;
  }

  if (failed) {
    return <p className="font-sans text-[0.9rem] text-destructive">History search failed.</p>;
  }

  if (!results || results.length === 0) {
    return (
      <p className="font-sans text-[0.9rem] text-text-muted">
        No matching item found in this window
      </p>
    );
  }

  return (
    <div>
      {judged === false ? (
        <p className="mb-3 font-sans text-[0.8rem] text-text-faint">
          AI ranking unavailable — showing keyword matches
        </p>
      ) : null}
      <div className="border-t border-border">
        {results.map((match) => (
          <HistoryResultRow key={`${match.kind}-${match.id}`} match={match} />
        ))}
      </div>
    </div>
  );
}
