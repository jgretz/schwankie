import {getFormProps, useForm} from '@conform-to/react';
import {json, useFetcher, useLoaderData} from '@remix-run/react';
import {queryFeedStats} from '@www/services/domain/feedStats.query';
import {refreshFeed} from '@www/services/rss/refreshFeed.post';
import {formatDistanceToNow} from 'date-fns';
import {RefreshCw, CheckCheck} from 'lucide-react';
import {useEffect, useState} from 'react';
import {match} from 'ts-pattern';

interface Props {
  refresh: () => void;
}

type Intents = 'refreshFeed' | 'markAsRead';

export async function loader() {
  const stats = await queryFeedStats();
  return json({
    lastLoad: stats?.lastLoad ?? undefined,
  });
}

export async function action({request}: {request: Request}) {
  const formData = await request.formData();
  const intent = formData.get('intent') as Intents;

  const data = await match(intent)
    .with('refreshFeed', async () => {
      return await refreshFeed();
    })
    .with('markAsRead', async () => {})
    .exhaustive();

  return {
    success: true,
    data,
  } as {success: boolean; data: unknown};
}

function formatLastUpdate(lastLoad?: string) {
  return match(lastLoad)
    .with(undefined, () => 'never')
    .otherwise((x) => formatDistanceToNow(new Date(x)));
}

export default function CommandBar({refresh}: Props) {
  // stats
  const initialData = useLoaderData<typeof loader>();
  const statsFetcher = useFetcher<typeof loader>();
  const [lastLoad, setLastLoad] = useState(formatLastUpdate(initialData.lastLoad));

  useEffect(() => {
    if (!statsFetcher.data || statsFetcher.state === 'loading') {
      return;
    }

    if (statsFetcher.data) {
      setLastLoad(formatLastUpdate(statsFetcher.data.lastLoad));
    }
  }, [statsFetcher.data]);

  // refresh feed
  const refreshFeedFetcher = useFetcher<typeof action>();
  useEffect(() => {
    refresh();

    statsFetcher.load('/reader/resources/command-bar');
  }, [refreshFeedFetcher.data]);

  // JSX
  return (
    <div className="flex flex-row justify-between items-center w-full h-[50px] bg-primary px-5">
      <div>Last Update: {lastLoad}</div>

      <refreshFeedFetcher.Form
        method="POST"
        action="/reader/resources/command-bar"
        className="flex flex-row"
      >
        <button type="submit" name="intent" value="markAsRead">
          <CheckCheck size={24} />
        </button>
        <div className="bg-secondary mx-2 w-[2px]"></div>

        <button type="submit" name="intent" value="refreshFeed">
          <RefreshCw size={24} />
        </button>
      </refreshFeedFetcher.Form>
    </div>
  );
}
