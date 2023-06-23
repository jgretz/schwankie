import {useLoaderData} from '@remix-run/react';
import {CardList} from '~/components/card';
import {Navbar} from '~/components/navbar';
import {loadLinks} from '~/services';

import type {LoaderArgs, V2_MetaFunction} from '@remix-run/node';
import {loadMainTags} from '~/services/api/loadMainTags';
import {loadTopTags} from '~/services/api/loadTopTags';
import {loadRecentTags} from '~/services/api/loadRecentTags';

export const meta: V2_MetaFunction = () => {
  return [
    {title: 'Schwankie.com'},
    {name: 'description', content: 'Schwankie.com - an alternative memory'},
  ];
};

export async function loader({request}: LoaderArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get('query') || undefined;
  const searchSize = url.searchParams.get('size');
  const size = searchSize ? parseInt(searchSize, 10) : undefined;

  // load links
  const links = await loadLinks({query, size});

  // load tags
  const mainTags = await loadMainTags();
  const topTags = await loadTopTags();
  const recentTags = await loadRecentTags();

  return {
    params: {
      query,
      size,
    },

    links,
    mainTags,
    topTags,
    recentTags,
  };
}

export default function Index() {
  const {links, mainTags, topTags, recentTags, params} = useLoaderData();

  return (
    <div className="pb-5">
      <Navbar {...{params, mainTags, topTags, recentTags}} />
      <CardList links={links} />
    </div>
  );
}
