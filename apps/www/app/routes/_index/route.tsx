import type {LoaderFunctionArgs, MetaFunction} from '@remix-run/node';
import {useFetcher, useLoaderData} from '@remix-run/react';
import {InfiniteScroller} from '@www/components/infinite-scroller';

import {description, title} from '@www/constants/seo.constants';
import {queryLinks} from '@www/services/domain/links.query';
import {useCallback, useEffect, useState} from 'react';
import {match} from 'ts-pattern';
import {LinkList} from './_components/link-list';
import ThemeSwitch from '../resources+/theme-switch';
import {useTheme} from '@www/hooks/useTheme';

export const meta: MetaFunction = () => {
  return [{title: title()}, {name: 'description', content: description()}];
};

type LinkResponse = Awaited<ReturnType<typeof fetchLinks>>;

async function fetchLinks(page: number) {
  const links = await queryLinks(page);

  return {
    page,
    links: links || [],
  };
}

export async function loader({request}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = match(url.searchParams.get('page'))
    .with(null, () => 0)
    .otherwise((page) => Number(page));

  return await fetchLinks(page);
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
    fetcher.load(`?index&page=${page}`);
  }, [fetcher.data]);

  const loading = fetcher.state === 'loading';

  const theme = useTheme();

  return (
    <>
      <ThemeSwitch userPreference={theme} />
      <InfiniteScroller loadNext={loadNext} loading={loading}>
        <LinkList links={links} />
      </InfiniteScroller>
    </>
  );
}
