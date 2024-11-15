import {getFormProps, useForm} from '@conform-to/react';
import {json, useFetcher, useLoaderData} from '@remix-run/react';
import {queryFeedStats} from '@www/services/domain/feedStats.query';
import {markAsRead} from '@www/services/rss/markAsRead.post';
import {refreshFeed} from '@www/services/rss/refreshFeed.post';
import {formatDistanceToNow} from 'date-fns';
import {RefreshCw, CheckCheck} from 'lucide-react';
import {useEffect, useState} from 'react';
import {match} from 'ts-pattern';

interface Props {
  mostRecentItemId?: number;

  setWorking: (working: boolean) => void;
  refresh: () => void;
}

type Intents = 'refreshFeed' | 'markAsRead';
type LoaderStats = {
  lastLoad: Date | undefined;
  unreadCount: number;
};

export async function loader() {
  const stats = await queryFeedStats();

  return json({
    lastLoad: stats?.lastLoad ?? undefined,
    unreadCount: stats?.unreadCount ?? 0,
  } as LoaderStats);
}

export async function action({request}: {request: Request}) {
  const formData = await request.formData();
  const intent = formData.get('intent') as Intents;

  const data = await match(intent)
    .with('refreshFeed', async () => {
      return await refreshFeed();
    })
    .with('markAsRead', async () => {
      const mostRecentItemId = Number(formData.get('mostRecentItemId'));
      await markAsRead(mostRecentItemId);

      return {};
    })
    .exhaustive();

  return {
    success: true,
    data,
  } as {success: boolean; data: unknown};
}

function formatLastUpdate(date?: Date | string | undefined) {
  return match(date)
    .with(undefined, () => 'never')
    .otherwise((x) => formatDistanceToNow(x, {addSuffix: true}));
}

export default function CommandBar({refresh, setWorking, mostRecentItemId}: Props) {
  // stats
  const initialData = useLoaderData<LoaderStats>();
  const statsFetcher = useFetcher<LoaderStats>();
  const [stats, setStats] = useState(initialData);

  useEffect(() => {
    if (!statsFetcher.data || statsFetcher.state === 'loading') {
      return;
    }

    if (statsFetcher.data) {
      setStats(statsFetcher.data);
    }
  }, [statsFetcher.data]);

  // commands
  const [commandForm] = useForm({
    onSubmit: async () => {
      setWorking(true);
    },
  });

  const commandFetcher = useFetcher<typeof action>();
  useEffect(() => {
    refresh();

    statsFetcher.load('/reader/resources/command-bar');
  }, [commandFetcher.data]);

  const markAsReadEnabled = (mostRecentItemId ?? 0) > 0;

  // JSX
  return (
    <div className="flex flex-row justify-between items-center w-full h-[50px] bg-primary px-5">
      <div>
        <span className="mr-1">Updated {formatLastUpdate(stats.lastLoad)}</span>
        <span className="pl-1 border-l border-secondary">{stats.unreadCount} Unread Articles</span>
      </div>

      <commandFetcher.Form
        {...getFormProps(commandForm)}
        method="POST"
        action="/reader/resources/command-bar"
        className="flex flex-row"
      >
        <input type="hidden" name="mostRecentItemId" value={mostRecentItemId} />
        <button type="submit" name="intent" value="markAsRead" disabled={!markAsReadEnabled}>
          <CheckCheck size={24} />
        </button>
        <div className="bg-secondary mx-2 w-[2px]"></div>

        <button type="submit" name="intent" value="refreshFeed">
          <RefreshCw size={24} />
        </button>
      </commandFetcher.Form>
    </div>
  );
}
