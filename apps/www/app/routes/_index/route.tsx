import type {LoaderFunctionArgs, MetaFunction} from '@remix-run/node';
import {useFetcher, useLoaderData} from '@remix-run/react';
import {InfiniteScroller} from '@www/components/infinite-scroller';

import {description, title} from '@www/constants/seo.constants';
import {queryLinks} from '@www/services/domain/links.query';
import {useCallback, useEffect, useState} from 'react';
import {match} from 'ts-pattern';
import {LinkList} from './_components/link-list';
import Search from './_components/search';
import Page from '@www/components/page';
import {Loading} from './_components/loading';

export const meta: MetaFunction = () => {
  return [{title: title()}, {name: 'description', content: description()}];
};

type LinkResponse = Awaited<ReturnType<typeof fetchLinks>>;

async function fetchLinks(page: number, query: string) {
  const links = await queryLinks(page, query);

  return {
    page,
    query,
    links: links || [],
  };
}

export async function loader({request}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = match(url.searchParams.get('page'))
    .with(null, () => 0)
    .otherwise((page) => Number(page));

  const query = match(url.searchParams.get('query'))
    .with(null, () => '')
    .otherwise((query) => query);

  return await fetchLinks(page, query);
}

export default function Index() {
  const initialData = useLoaderData<LinkResponse>();
  const fetcher = useFetcher<LinkResponse>();

  const [links, setLinks] = useState(initialData.links);

  useEffect(() => {
    if (!fetcher.data || fetcher.state === 'loading') {
      return;
    }

    if (fetcher.data) {
      const newLinks = fetcher.data.links;
      setLinks((prevLinks) => [...prevLinks, ...newLinks]);
    }
  }, [fetcher.data]);

  const loadNext = useCallback(() => {
    const page = fetcher.data ? fetcher.data.page + 1 : initialData.page + 1;
    const query = fetcher.data ? fetcher.data.query : initialData.query;

    fetcher.load(`?index&page=${page}&query=${query}`);
  }, [fetcher.data]);

  const loading = fetcher.state === 'loading';

  return (
    <Page>
      <Search initialQuery={initialData.query} />
      <InfiniteScroller loadNext={loadNext} loading={loading}>
        <LinkList links={links} />
        <Loading display={loading} />
      </InfiniteScroller>
    </Page>
  );
}