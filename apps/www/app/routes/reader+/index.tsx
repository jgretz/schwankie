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

export default function RSS() {
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
    setFeedItems([]);
    fetcher.load(`?index`);
  }, []);

  const loading = fetcher.state === 'loading';

  return (
    <div>
      <CommandBar refresh={refresh} />
      <InfiniteScroller loadNext={loadNext} loading={loading}>
        <FeedList feedItems={feedItems} />
        <Loading display={loading} />
      </InfiniteScroller>
    </div>
  );
}
