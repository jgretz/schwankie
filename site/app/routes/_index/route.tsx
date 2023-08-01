import {json, type LoaderArgs, type V2_MetaFunction} from '@remix-run/node';

import {parseSearchParams} from '~/services/util/parseSearchParams';

import {Navbar} from './_components/navbar';
import {LinkList} from './_components/link_list';
import {LoadMore} from './_components/load_more';

import {loadLinks} from '~/services/api/links/loadLinks';
import {loadMainTags} from '~/services/api/tags/loadMainTags';
import {loadRecentTags} from '~/services/api/tags/loadRecentTags';
import {loadTopTags} from '~/services/api/tags/loadTopTags';
import isbot from 'isbot';

export const meta: V2_MetaFunction = () => {
  return [
    {title: 'Schwankie.com'},
    {name: 'description', content: 'Schwankie.com - an alternative memory'},
  ];
};

export async function loader({ request }: LoaderArgs) {
  // prevent crawling all the links
  if (isbot(request.headers.get('user-agent'))) {
    return { links: [], mainTags: [], topTags: [], recentTags: [] };
  }

  const url = new URL(request.url);
  const params = parseSearchParams(url.searchParams);

  // load data
  const links = await loadLinks(params);

  const mainTags = await loadMainTags();
  const topTags = await loadTopTags();
  const recentTags = await loadRecentTags();

  // format return
  return json({links, mainTags, topTags, recentTags});
}

export default function Index() {
  return (
    <div className="pb-5">
      <Navbar />
      <LinkList />
      <LoadMore />
    </div>
  );
}
