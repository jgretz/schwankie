import type {LoaderFunctionArgs} from '@remix-run/node';
import {useFetcher, useLoaderData} from '@remix-run/react';
import {queryRssFeedItems} from '@www/services/rss/feedItems.query';
import {requireUser} from '@www/services/security/requireUser';
import {match} from 'ts-pattern';
import {InfiniteScroller} from '@www/components/infinite-scroller';
import {Loading} from '@www/components/loading';
import {useCallback, useEffect, useState} from 'react';
import {FeedList} from './_components/feed-list';
import CommandBar from './resources+/command-bar';
import {encodeQueryStringFromJsonObject} from 'utility-util';
import Spinner from '@www/components/spinner';
import {queryFeedStats} from '@www/services/domain/feedStats.query';
import {Button} from '@www/components/ui/button';

type FeedItemResponse = Awaited<ReturnType<typeof fetchFeedItems>>;

async function fetchFeedItems(page: number, includeRead?: boolean, feedId?: number) {
  const feedItems = await queryRssFeedItems(page, includeRead, feedId);
  const stats = await queryFeedStats();

  return {
    page,
    includeRead,
    feedId,

    feedItems: feedItems || [],
    totalFeedItems: stats?.unreadCount ?? 0,
  };
}

export async function loader({request}: LoaderFunctionArgs) {
  await requireUser(request, 'google-reader');

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
      <Spinner />
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

function ReturnToTopButton({show}: {show: boolean}) {
  const returnToTop = useCallback(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!show) {
    return null;
  }

  return (
    <div className="w-full flex flex-row items-center justify-center mt-[-70px] mb-1">
      <Button onClick={returnToTop}>Return To Top</Button>
    </div>
  );
}

export default function RSS() {
  // feed items
  const initialData = useLoaderData<FeedItemResponse>();
  const fetcher = useFetcher<FeedItemResponse>();

  const [feedItems, setFeedItems] = useState(initialData.feedItems);
  const [totalFeedItems, setTotalFeedItems] = useState(initialData.totalFeedItems);

  useEffect(() => {
    if (!fetcher.data || fetcher.state === 'loading') {
      return;
    }

    if (fetcher.data) {
      const newFeedItems = fetcher.data.feedItems;
      setFeedItems((prevItems) => [...prevItems, ...newFeedItems]);

      const newTotalFeedItems = fetcher.data.totalFeedItems;
      setTotalFeedItems(newTotalFeedItems);
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
  const showBottomButton = totalFeedItems > 0 && feedItems.length >= totalFeedItems;

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
      <ReturnToTopButton show={showBottomButton} />
    </div>
  );
}
