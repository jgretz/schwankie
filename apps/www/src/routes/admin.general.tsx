import {createFileRoute} from '@tanstack/react-router';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {Button} from '@www/components/ui/button';
import {getSetting} from 'client';
import {setSettingAction} from '@www/lib/settings-actions';
import {initClient} from '@www/lib/init-client';
import {useState, useEffect} from 'react';

initClient();

export const Route = createFileRoute('/admin/general')({
  component: AdminGeneralPage,
});

function AdminGeneralPage() {
  const queryClient = useQueryClient();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const {data: settingData, isLoading: settingLoading} = useQuery({
    queryKey: ['setting', 'tagCountFloor'],
    queryFn: async () => {
      try {
        return await getSetting('tagCountFloor');
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          return {key: 'tagCountFloor', value: '1'};
        }
        throw error;
      }
    },
    enabled: mounted,
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
      <div className="mb-5 flex items-baseline gap-3">
        <h2 className="font-serif text-[1.35rem] font-semibold text-text">General Settings</h2>
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
          <p className="font-sans text-[0.8rem] text-red-600 dark:text-red-400">{floorSaveError}</p>
        )}
      </div>
    </div>
  );
}
