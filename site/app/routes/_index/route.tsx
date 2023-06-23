import {useLoaderData} from '@remix-run/react';
import {CardList} from '~/components/card';
import {Navbar} from '~/components/navbar';
import {loadLinks} from '~/services';

import type {V2_MetaFunction} from '@remix-run/node';
import {loadMainTags} from '~/services/api/loadMainTags';
import {loadTopTags} from '~/services/api/loadTopTags';
import {loadRecentTags} from '~/services/api/loadRecentTags';

export const meta: V2_MetaFunction = () => {
  return [
    {title: 'Schwankie.com'},
    {name: 'description', content: 'Schwankie.com - an alternative memory'},
  ];
};

export async function loader() {
  const links = await loadLinks();
  const mainTags = await loadMainTags();
  const topTags = await loadTopTags();
  const recentTags = await loadRecentTags();

  return {
    links,
    mainTags,
    topTags,
    recentTags,
  };
}

export default function Index() {
  const {links, mainTags, topTags, recentTags} = useLoaderData();

  return (
    <div className="pb-5">
      <Navbar {...{mainTags, topTags, recentTags}} />
      <CardList links={links} />
    </div>
  );
}
