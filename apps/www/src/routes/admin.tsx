import {createFileRoute, redirect} from '@tanstack/react-router';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useDeadLinks} from '@www/hooks/use-dead-links';
import {Button} from '@www/components/ui/button';
import {getSetting} from 'client';
import {setSettingAction} from '@www/lib/settings-actions';
import {initClient} from '@www/lib/init-client';
import {useState, useEffect} from 'react';

initClient();

export const Route = createFileRoute('/admin')({
  beforeLoad: ({context}) => {
    if (!context.auth.authenticated) {
      throw redirect({to: '/'});
    }
  },
  head: () => ({
    meta: [{title: 'Admin — schwankie'}],
  }),
  component: AdminPage,
});

function AdminPage() {
  const {data, isLoading, isError, retryLink, deleteLink} = useDeadLinks();
  const items = data?.items ?? [];
  const queryClient = useQueryClient();

  // Tag count floor settings
  const {data: settingData, isLoading: settingLoading} = useQuery({
    queryKey: ['setting', 'tagCountFloor'],
    queryFn: async () => {
      try {
        return await getSetting('tagCountFloor');
      } catch (error) {
        // 404 = setting not yet created, fall back to default
        if (error instanceof Error && error.message.includes('404')) {
          return {key: 'tagCountFloor', value: '1'};
        }
        throw error;
      }
    },
  });

  const [floorValue, setFloorValue] = useState('1');
  const [floorSaveError, setFloorSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (settingData) {
      setFloorValue(settingData.value);
    }
  }, [settingData]);

  const floorMutation = useMutation({
    mutationFn: async (value: string) => {
      await setSettingAction({data: {key: 'tagCountFloor', value}});
    },
    onSuccess: () => {
      setFloorSaveError(null);
      queryClient.invalidateQueries({queryKey: ['tags']});
    },
    onError: (error) => {
      console.error('Failed to save tagCountFloor setting:', error);
      setFloorSaveError('Failed to save. Please try again.');
    },
  });

  const handleSaveFloor = () => {
    const num = Number(floorValue);
    if (!Number.isInteger(num) || num < 1) {
      setFloorSaveError('Value must be a whole number of 1 or greater.');
      return;
    }
    setFloorSaveError(null);
    floorMutation.mutate(String(num));
  };

  return (
    <div className="px-6 py-6">
      <div className="mb-8">
        <div className="mb-5 flex items-baseline gap-3">
          <h2 className="font-serif text-[1.35rem] font-semibold text-text">Settings</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex flex-col">
              <label htmlFor="tag-floor" className="mb-1 font-sans text-[0.85rem] text-text-muted">
                Tag count floor
              </label>
              <input
                id="tag-floor"
                type="number"
                min="1"
                value={floorValue}
                onChange={(e) => setFloorValue(e.target.value)}
                disabled={settingLoading}
                className="w-20 rounded border border-border bg-bg px-2 py-1.5 font-sans text-[0.9rem] text-text disabled:opacity-50"
              />
            </div>
            <Button
              size="sm"
              onClick={handleSaveFloor}
              disabled={settingLoading || floorMutation.isPending}
              variant="default"
            >
              {floorMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
          <p className="font-sans text-[0.8rem] text-text-faint">
            Tags with fewer links than this value will be hidden from the sidebar.
          </p>
          {floorSaveError && (
            <p className="font-sans text-[0.8rem] text-red-600 dark:text-red-400">
              {floorSaveError}
            </p>
          )}
        </div>
      </div>

      <div className="mb-5 flex items-baseline gap-3">
        <h2 className="font-serif text-[1.35rem] font-semibold text-text">Dead Links</h2>
        <span className="font-sans text-[0.8rem] text-text-faint">{data?.total ?? 0}</span>
      </div>

      {isLoading && (
        <div className="animate-pulse space-y-4">
          {Array.from({length: 3}, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-3/4 rounded bg-border" />
              <div className="h-3 w-1/2 rounded bg-border" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <p className="py-12 text-center font-sans text-[0.9rem] text-red-600">
          Failed to load dead links.
        </p>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <p className="py-12 text-center font-sans text-[0.9rem] text-text-muted">
          No dead links. All clear.
        </p>
      )}

      {items.length > 0 && (
        <div>
          {items.map((item) => (
            <div key={item.id} className="border-b border-border py-[0.9rem] last:border-b-0">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-[0.3rem] block font-serif text-[0.975rem] font-medium leading-[1.35] text-text transition-colors duration-100 hover:text-accent"
              >
                {item.title}
              </a>

              <p className="mb-2 font-sans text-[0.78rem] text-text-faint">{item.url}</p>

              <div className="flex items-center gap-3">
                <span className="rounded bg-red-100 px-2 py-0.5 font-sans text-[0.72rem] text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  {item.enrichmentLastError} ({item.enrichmentFailCount} failures)
                </span>

                <div className="ml-auto flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => retryLink(item.id)}>
                    Retry
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteLink(item.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
