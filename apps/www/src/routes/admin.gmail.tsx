import {createFileRoute} from '@tanstack/react-router';
import {useState, useCallback, useEffect} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {z} from 'zod';
import {toast} from 'sonner';
import {Button} from '@www/components/ui/button';
import {useGmailStatus} from '@www/hooks/use-gmail-status';
import {disconnectGmailAction, setGmailFilterAction} from '@www/lib/gmail-actions';
import {getGmailAuthUrl} from 'client';

export const Route = createFileRoute('/admin/gmail')({
  validateSearch: z.object({
    error: z.string().optional(),
  }),
  component: AdminGmailPage,
});

function AdminGmailPage() {
  const queryClient = useQueryClient();
  const search = Route.useSearch();
  const {data: status, isLoading, error} = useGmailStatus();
  const [filter, setFilter] = useState('');
  const [filterLoading, setFilterLoading] = useState(false);

  useEffect(() => {
    if (status?.filter) {
      setFilter(status.filter);
    }
  }, [status?.filter]);

  useEffect(() => {
    if (search.error) {
      toast.error(search.error);
    }
  }, [search.error]);

  const handleConnect = useCallback(async () => {
    try {
      const {url} = await getGmailAuthUrl();
      window.location.href = url;
    } catch (error) {
      console.error('Failed to get auth URL:', error);
      toast.error('Failed to connect Gmail');
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    if (!confirm('Disconnect Gmail? Email imports will stop.')) return;

    try {
      await disconnectGmailAction();
      await queryClient.invalidateQueries({queryKey: ['gmail-status']});
      toast.success('Gmail disconnected');
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast.error('Failed to disconnect Gmail');
    }
  }, [queryClient]);

  const handleFilterSave = useCallback(
    async (newFilter: string) => {
      setFilterLoading(true);
      try {
        await setGmailFilterAction({data: {filter: newFilter}});
        setFilter(newFilter);
        toast.success('Filter saved');
      } catch (error) {
        console.error('Failed to save filter:', error);
        toast.error('Failed to save filter');
      } finally {
        setFilterLoading(false);
      }
    },
    [],
  );

  const debouncedSave = useCallback(
    (() => {
      let timeout: NodeJS.Timeout;
      return (value: string) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          handleFilterSave(value);
        }, 500);
      };
    })(),
    [handleFilterSave],
  );

  const handleTestFilter = useCallback(() => {
    if (!filter.trim()) {
      toast.error('Filter is empty');
      return;
    }
    toast.success(`Filter syntax valid: "${filter}"`);
  }, [filter]);

  if (isLoading) {
    return (
      <div className="px-6 py-6">
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-6">
        <p className="text-red-600">Failed to load Gmail status</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      <div className="mb-5 flex items-baseline gap-3">
        <h2 className="font-serif text-[1.35rem] font-semibold text-text">Gmail</h2>
      </div>

      <div className="space-y-6">
        <div className="border border-border rounded-lg p-6 space-y-6">
          <div>
            <h3 className="font-serif text-lg text-text mb-4">Connection</h3>

            {status?.connected ? (
              <div className="p-3 bg-bg-subtle rounded">
                <p className="font-sans text-[0.9rem] text-text">
                  <span className="font-semibold">Connected:</span> {status.email}
                </p>
                {status.lastImportedAt && (
                  <p className="font-sans text-[0.85rem] text-text-muted mt-2">
                    Last imported: {new Date(status.lastImportedAt).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-text-muted font-sans text-[0.9rem]">Gmail is not connected. Connect to start importing emails.</p>
            )}
          </div>

          {status?.connected && (
            <>
              <div className="pt-4 border-t border-border">
                <h3 className="font-serif text-lg text-text mb-4">Filter</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block font-sans text-[0.9rem] text-text mb-2">Email Filter (IMAP search query)</label>
                    <textarea
                      value={filter}
                      onChange={(e) => {
                        setFilter(e.target.value);
                        debouncedSave(e.target.value);
                      }}
                      placeholder="e.g., from:example@gmail.com subject:important"
                      className="w-full px-3 py-2 border border-border rounded font-sans text-[0.9rem] text-text bg-bg placeholder-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
                      disabled={filterLoading}
                      rows={3}
                    />
                    <p className="font-sans text-[0.8rem] text-text-muted mt-2">
                      Use IMAP search syntax to filter which emails are imported. Leave empty to import all emails.
                    </p>
                  </div>

                  <Button size="sm" variant="outline" onClick={handleTestFilter} disabled={!filter.trim()}>
                    Test Filter
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button variant="destructive" onClick={handleDisconnect}>
                  Disconnect Gmail
                </Button>
              </div>
            </>
          )}

          {!status?.connected && (
            <Button onClick={handleConnect}>Connect Gmail</Button>
          )}
        </div>
      </div>
    </div>
  );
}
