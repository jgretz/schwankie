import {createFileRoute, redirect, useNavigate} from '@tanstack/react-router';
import {useState, useCallback} from 'react';
import {z} from 'zod';
import {Button} from '@www/components/ui/button';
import {useEmailItems, useMarkEmailItemRead, usePromoteEmailItem} from '@www/hooks/use-email-items';
import type {EmailItemData} from 'client';

const searchSchema = z.object({
  unread: z.enum(['true', 'false']).optional().catch('true').transform((v) => v === 'true'),
  from: z.string().optional(),
});

type EmailSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute('/email/')({
  beforeLoad: ({context}) => {
    if (!context.auth.authenticated) {
      throw redirect({to: '/'});
    }
  },
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      {title: 'Email — schwankie'},
      {name: 'description', content: 'Your email items.'},
    ],
  }),
  component: EmailPage,
});

function EmailPage() {
  const search = Route.useSearch() as EmailSearch;
  const navigate = useNavigate();
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());

  const {data: emailData, isLoading} = useEmailItems({unread: search.unread, from: search.from});
  const markReadMutation = useMarkEmailItemRead();
  const promoteMutation = usePromoteEmailItem();

  const handleToggleUnread = useCallback(() => {
    navigate({search: {unread: (!search.unread).toString(), from: search.from}});
  }, [navigate, search.unread, search.from]);

  const handleMarkRead = useCallback(
    (itemId: string) => async () => {
      try {
        await markReadMutation.mutateAsync(itemId);
        setHiddenItems((prev) => new Set([...prev, itemId]));
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    },
    [markReadMutation],
  );

  const handlePromote = useCallback(
    (itemId: string) => async () => {
      try {
        await promoteMutation.mutateAsync(itemId);
        setHiddenItems((prev) => new Set([...prev, itemId]));
      } catch (error) {
        console.error('Failed to promote:', error);
      }
    },
    [promoteMutation],
  );

  const handleOpen = (url: string) => {
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-muted">Loading emails...</p>
      </div>
    );
  }

  const items = emailData?.items ?? [];
  const visibleItems = items.filter((item) => !hiddenItems.has(item.id));

  const groupedItems: Record<string, EmailItemData[]> = {};
  for (const item of visibleItems) {
    if (!groupedItems[item.emailFrom]) {
      groupedItems[item.emailFrom] = [];
    }
    groupedItems[item.emailFrom].push(item);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-text mb-1">Email</h1>
          <p className="text-text-muted font-sans text-[0.9rem]">{visibleItems.length} item{visibleItems.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleToggleUnread}
          className={`px-3 py-1 rounded-full font-sans text-[0.85rem] transition-colors ${
            search.unread
              ? 'bg-accent text-accent-foreground'
              : 'bg-bg-subtle text-text hover:bg-border'
          }`}
        >
          {search.unread ? 'Unread' : 'All'}
        </button>
      </div>

      {visibleItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted font-sans">No emails to show.</p>
        </div>
      ) : search.from ? (
        <div className="space-y-2">
          {visibleItems.map((item) => (
            <EmailItemRow
              key={item.id}
              item={item}
              onMarkRead={() => handleMarkRead(item.id)()}
              onPromote={() => handlePromote(item.id)()}
              onOpen={() => handleOpen(item.link)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([sender, senderItems]) => (
            <div key={sender}>
              <h2 className="font-serif text-lg text-text mb-3">{sender}</h2>
              <div className="space-y-2">
                {senderItems.map((item) => (
                  <EmailItemRow
                    key={item.id}
                    item={item}
                    onMarkRead={() => handleMarkRead(item.id)()}
                    onPromote={() => handlePromote(item.id)()}
                    onOpen={() => handleOpen(item.link)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmailItemRow({item, onMarkRead, onPromote, onOpen}: {item: EmailItemData; onMarkRead: () => void; onPromote: () => void; onOpen: () => void}) {
  return (
    <div className="border border-border rounded-lg p-4 hover:bg-bg-subtle transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-base text-text">{item.title || item.link}</h3>
          {item.description && (
            <p className="text-text-muted text-[0.9rem] mt-1 line-clamp-2">{item.description}</p>
          )}
          <p className="text-text-faint text-[0.85rem] mt-2">{item.emailFrom}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="ghost" onClick={onOpen}>
            Open
          </Button>
          {!item.read && (
            <Button size="sm" variant="ghost" onClick={onMarkRead}>
              Mark Read
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onPromote}>
            Promote
          </Button>
        </div>
      </div>
    </div>
  );
}
