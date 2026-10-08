import {type MouseEvent, useState} from 'react';
import {toast} from 'sonner';
import type {HistoryMatch} from 'client';
import {Button} from '@www/components/ui/button';
import {markEmailItemOpenedAction, promoteEmailItemAction} from '@www/lib/email-actions';
import {markRssItemOpenedAction, promoteRssItemAction} from '@www/lib/feed-actions';
import {formatHistoryMeta} from '@www/lib/history-search';
import {opensLink} from '@www/lib/opens-link';

type HistoryResultRowProps = {
  match: HistoryMatch;
};

function recordOpen(match: HistoryMatch): Promise<unknown> {
  return match.kind === 'rss'
    ? markRssItemOpenedAction({data: {feedId: match.feedId, itemId: match.id}})
    : markEmailItemOpenedAction({data: {id: match.id}});
}

function promote(match: HistoryMatch): Promise<unknown> {
  return match.kind === 'rss'
    ? promoteRssItemAction({data: {feedId: match.feedId, itemId: match.id}})
    : promoteEmailItemAction({data: {id: match.id}});
}

export function HistoryResultRow({match}: HistoryResultRowProps) {
  const [isPromoted, setIsPromoted] = useState(match.promoted);
  const [isLoading, setIsLoading] = useState(false);

  // Fire-and-forget: recording the open must never hold up navigation.
  function handleOpen(event: MouseEvent<HTMLAnchorElement>) {
    if (!opensLink(event.button)) return;
    recordOpen(match).catch(function (error) {
      console.warn('Failed to record history item open', error);
    });
  }

  async function handlePromote() {
    setIsLoading(true);
    try {
      await promote(match);
      setIsPromoted(true);
      toast.success('Added to queue');
    } catch (error) {
      toast.error('Failed to add to queue');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 transition-colors hover:bg-bg-subtle">
      <div className="min-w-0 flex-1">
        {/* biome-ignore lint/a11y/useValidAnchor: a real href navigates; onClick only records the open */}
        <a
          href={match.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleOpen}
          onAuxClick={handleOpen}
          className="block font-serif text-[1rem] text-text transition-colors hover:text-accent"
        >
          {match.title}
        </a>
        {match.reason ? (
          <p className="mt-1 font-sans text-[0.85rem] text-text-muted">{match.reason}</p>
        ) : null}
        <span className="mt-1 block font-sans text-[0.8rem] text-text-faint">
          {formatHistoryMeta(match)}
        </span>
      </div>
      <Button
        size="sm"
        variant={isPromoted ? 'outline' : 'default'}
        onClick={handlePromote}
        disabled={isPromoted || isLoading}
        className="flex-shrink-0 font-sans text-[0.8rem]"
      >
        {isPromoted ? 'Promoted' : 'Promote'}
      </Button>
    </div>
  );
}
