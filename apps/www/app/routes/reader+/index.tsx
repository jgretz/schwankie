import type {LoaderFunctionArgs} from '@remix-run/node';
import {redirect, useFetcher, useLoaderData} from '@remix-run/react';
import {queryRssFeedItems} from '@www/services/rss/feedItems.query';
import {requireUser} from '@www/services/security/requireUser';
import {ADMIN_ROUTES} from '../admin+/constants';
import {match} from 'ts-pattern';
import {InfiniteScroller} from '@www/components/infinite-scroller';
import {Loading} from '@www/components/loading';
import {useCallback, useEffect, useState} from 'react';
import {FeedList} from './_components/feed-list';
import CommandBar from './resources+/command-bar';
import {encodeQueryStringFromJsonObject} from 'utility-util';
import {feed} from 'packages/database/schema/rss.schema';

type FeedItemResponse = Awaited<ReturnType<typeof fetchFeedItems>>;

async function fetchFeedItems(page: number, includeRead?: boolean, feedId?: number) {
  const feedItems = await queryRssFeedItems(page, includeRead, feedId);

  return {
    page,
    includeRead,
    feedId,
    feedItems: feedItems || [],
  };
}

export async function loader({request}: LoaderFunctionArgs) {
  const user = await requireUser(request);
  if (!user) {
    return redirect(ADMIN_ROUTES.LOGIN);
  }

  const url = new URL(request.url);
  const page = match(url.searchParams.get('page'))
    .with(null, () => 0)
    .otherwise((page) => Number(page));

  const includeRead = match(url.searchParams.get('includeRead'))
    .with(null, () => undefined)
    .otherwise((i) => Boolean(i));

  const feedId = match(url.searchParams.get('feedId'))
    .with(null, () => undefined)
    .otherwise((i) => Number(i));

  return await fetchFeedItems(page, includeRead, feedId);
}

function Working() {
  return (
    <div className="w-full h-screen flex items-center justify-center text-primary">
      <div role="status">
        <svg
          aria-hidden="true"
          className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
      </div>
    </div>
  );
}

function NoContent() {
  return (
    <div className="w-full h-screen flex items-center justify-center text-primary">
      All items have been read, try refreshing to find more.
    </div>
  );
}

export default function RSS() {
  // feed items
  const initialData = useLoaderData<FeedItemResponse>();
  const fetcher = useFetcher<FeedItemResponse>();

  const [feedItems, setFeedItems] = useState(initialData.feedItems);

  useEffect(() => {
    if (!fetcher.data || fetcher.state === 'loading') {
      return;
    }

    if (fetcher.data) {
      const newFeedItems = fetcher.data.feedItems;
      setFeedItems((prevItems) => [...prevItems, ...newFeedItems]);
    }
  }, [fetcher.data]);

  const loadNext = useCallback(() => {
    const page = fetcher.data ? fetcher.data.page + 1 : initialData.page + 1;
    const includeRead = fetcher.data ? fetcher.data.includeRead : initialData.includeRead;
    const feedId = fetcher.data ? fetcher.data.feedId : initialData.feedId;

    const query = {page, includeRead, feedId};
    const queryString = encodeQueryStringFromJsonObject(query);

    fetcher.load(`?index&${queryString}`);
  }, [fetcher.data]);

  const refresh = useCallback(() => {
    setWorking(false);
    setFeedItems([]);

    fetcher.load(`?index`);
  }, []);

  // working
  const [working, setWorking] = useState(false);

  // derived state
  const loading = fetcher.state === 'loading';
  const mostRecentItemId = Math.max(...feedItems.map((x) => x.id || 0));

  // JSX
  const List = (
    <InfiniteScroller loadNext={loadNext} loading={loading}>
      <FeedList feedItems={feedItems} />
      <Loading display={loading} />
    </InfiniteScroller>
  );

  const Content = match({working, count: feedItems.length})
    .with({working: true}, () => <Working />)
    .with({count: 0}, () => <NoContent />)
    .otherwise(() => List);

  return (
    <div>
      <CommandBar refresh={refresh} setWorking={setWorking} mostRecentItemId={mostRecentItemId} />
      {Content}
    </div>
  );
}
