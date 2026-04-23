import {createFileRoute, redirect, useNavigate} from '@tanstack/react-router';
import {useState, useCallback, useEffect, useMemo, useRef} from 'react';
import {z} from 'zod';
import {toast} from 'sonner';
import type {EmailItemData} from 'client';
import {Button} from '@www/components/ui/button';
import {
  useEmailItems,
  useMarkAllEmailItemsRead,
  useMarkEmailItemRead,
  usePromoteEmailItem,
} from '@www/hooks/use-email-items';
import {triggerRefreshEmailsAction} from '@www/lib/work-request-actions';

const searchSchema = z.object({
  unread: z
    .enum(['true', 'false'])
    .optional()
    .catch('true')
    .transform((v) => v !== 'false'),
  from: z.string().optional(),
  group: z
    .enum(['true', 'false'])
    .optional()
    .catch('false')
    .transform((v) => v === 'true'),
});

type EmailSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute('/emails/')({
  beforeLoad: ({context}) => {
    if (!context.auth.authenticated) {
      throw redirect({to: '/auth/login', search: {error: undefined}});
    }
  },
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      {title: 'Emails — schwankie'},
      {name: 'description', content: 'Your email items.'},
    ],
  }),
  component: EmailsPage,
});

function EmailsPage() {
  const search = Route.useSearch() as EmailSearch;
  const navigate = useNavigate({from: '/emails/'});
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const emailsQuery = useEmailItems({
    unread: search.unread,
    from: search.from,
  });
  const markReadMutation = useMarkEmailItemRead();
  const promoteMutation = usePromoteEmailItem();
  const markAllReadMutation = useMarkAllEmailItemsRead();

  const items = useMemo<EmailItemData[]>(
    () => emailsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [emailsQuery.data],
  );
  const total = emailsQuery.data?.pages[0]?.total ?? 0;
  const visibleItems = useMemo(
    () => items.filter((item) => !hiddenItems.has(item.id)),
    [items, hiddenItems],
  );

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && emailsQuery.hasNextPage && !emailsQuery.isFetchingNextPage) {
          emailsQuery.fetchNextPage();
        }
      },
      {rootMargin: '200px', threshold: 0},
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [emailsQuery.hasNextPage, emailsQuery.isFetchingNextPage, emailsQuery.fetchNextPage]);

  const grouped = useMemo(() => {
    const groups: Record<string, EmailItemData[]> = {};
    for (const item of visibleItems) {
      if (!groups[item.emailFrom]) groups[item.emailFrom] = [];
      groups[item.emailFrom]!.push(item);
    }
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [visibleItems]);

  const senderOptions = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) set.add(item.emailFrom);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const toSearch = useCallback(
    (next: Partial<{unread: boolean; from: string | undefined; group: boolean}>) => ({
      unread: (next.unread ?? search.unread) ? 'true' : 'false',
      from: next.from !== undefined ? next.from : search.from,
      group: (next.group ?? search.group) ? 'true' : 'false',
    }),
    [search.unread, search.from, search.group],
  );

  const handleToggleUnread = useCallback(() => {
    navigate({search: toSearch({unread: !search.unread})});
  }, [navigate, toSearch, search.unread]);

  const handleToggleGroup = useCallback(() => {
    navigate({search: toSearch({group: !search.group})});
  }, [navigate, toSearch, search.group]);

  const handleSenderFilter = useCallback(
    (value: string) => {
      navigate({search: toSearch({from: value || undefined})});
    },
    [navigate, toSearch],
  );

  const handleMarkRead = useCallback(
    (id: string) => async () => {
      try {
        await markReadMutation.mutateAsync(id);
        setHiddenItems((prev) => new Set([...prev, id]));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to mark as read');
      }
    },
    [markReadMutation],
  );

  const handlePromote = useCallback(
    (id: string) => async () => {
      try {
        await promoteMutation.mutateAsync(id);
        setHiddenItems((prev) => new Set([...prev, id]));
        toast.success('Added to queue');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to promote');
      }
    },
    [promoteMutation],
  );

  const handleMarkAllRead = useCallback(async () => {
    try {
      const result = await markAllReadMutation.mutateAsync(search.from);
      toast.success(`Marked ${result.count} as read`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark all read');
    }
  }, [markAllReadMutation, search.from]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await triggerRefreshEmailsAction();
      toast.success('Emails refresh queued');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to queue refresh');
    } finally {
      setIsRefreshing(false);
    }
  };

  const showGrouped = search.group && !search.from;

  return (
    <div className="space-y-6 px-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-text mb-1">Emails</h1>
          <p className="text-text-muted font-sans text-[0.9rem]">
            {visibleItems.length} of {total} {search.unread ? 'unread' : ''} item
            {total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}
          >
            {markAllReadMutation.isPending ? 'Marking…' : 'Mark all read'}
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleToggleUnread}
          className={`px-3 py-1 rounded-full font-sans text-[0.85rem] transition-colors ${
            search.unread
              ? 'bg-accent text-accent-foreground'
              : 'bg-bg-subtle text-text hover:bg-border'
          }`}
        >
          {search.unread ? 'Unread' : 'All'}
        </button>

        <button
          type="button"
          onClick={handleToggleGroup}
          disabled={Boolean(search.from)}
          className={`px-3 py-1 rounded-full font-sans text-[0.85rem] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            search.group && !search.from
              ? 'bg-accent text-accent-foreground'
              : 'bg-bg-subtle text-text hover:bg-border'
          }`}
        >
          Group by sender
        </button>

        {senderOptions.length > 1 && (
          <select
            value={search.from ?? ''}
            onChange={(e) => handleSenderFilter(e.target.value)}
            className="rounded-md border border-border bg-bg px-3 py-1 font-sans text-[0.85rem] text-text max-w-[320px]"
          >
            <option value="">All senders</option>
            {senderOptions.map((sender) => (
              <option key={sender} value={sender}>
                {sender}
              </option>
            ))}
          </select>
        )}
      </div>

      {emailsQuery.isLoading ? (
        <div className="text-center py-12 text-text-muted">Loading emails…</div>
      ) : emailsQuery.isError ? (
        <div className="text-center py-12 text-destructive">Failed to load emails.</div>
      ) : visibleItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted font-sans">
            {search.unread ? 'No unread emails.' : 'No emails.'}
          </p>
        </div>
      ) : showGrouped ? (
        <div className="space-y-6">
          {grouped.map(([sender, senderItems]) => (
            <section key={sender}>
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="font-serif text-lg text-text truncate">{sender}</h2>
                <span className="font-sans text-[0.8rem] text-text-faint">
                  {senderItems.length} item{senderItems.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                {senderItems.map((item) => (
                  <EmailRow
                    key={item.id}
                    item={item}
                    onMarkRead={handleMarkRead(item.id)}
                    onPromote={handlePromote(item.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          {visibleItems.map((item) => (
            <EmailRow
              key={item.id}
              item={item}
              showSender
              onMarkRead={handleMarkRead(item.id)}
              onPromote={handlePromote(item.id)}
            />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />

      {emailsQuery.isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
        </div>
      )}
    </div>
  );
}

type EmailRowProps = {
  item: EmailItemData;
  showSender?: boolean;
  onMarkRead: () => Promise<void>;
  onPromote: () => Promise<void>;
};

function EmailRow({item, showSender, onMarkRead, onPromote}: EmailRowProps) {
  const d = new Date(item.importedAt);
  const datePart = d.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
  const timePart = d.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'});
  const date = `${datePart} @ ${timePart}`;

  return (
    <div className="flex items-center justify-between border-b border-border py-3 px-4 hover:bg-bg-subtle transition-colors group">
      <div className="flex-1 min-w-0">
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text hover:text-accent transition-colors font-sans text-[0.95rem] block truncate"
        >
          {item.title || item.link}
        </a>
        {item.description && (
          <p className="text-text-muted font-sans text-[0.85rem] line-clamp-2 mt-1">
            {item.description}
          </p>
        )}
        <span className="text-text-faint font-sans text-[0.8rem] mt-1 block truncate">
          {showSender ? `${item.emailFrom} · ${date}` : date}
        </span>
      </div>
      <div className="flex gap-2 ml-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {!item.read && (
          <Button size="sm" variant="outline" onClick={onMarkRead} className="text-[0.8rem]">
            Mark read
          </Button>
        )}
        <Button size="sm" variant="default" onClick={onPromote} className="text-[0.8rem]">
          Promote
        </Button>
      </div>
    </div>
  );
}
