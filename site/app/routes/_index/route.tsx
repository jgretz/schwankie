import {useLoaderData} from '@remix-run/react';
import {CardList} from '~/components/card';
import {Navbar} from '~/components/navbar';
import {loadLinks} from '~/services';

import type {V2_MetaFunction} from '@remix-run/node';

export const meta: V2_MetaFunction = () => {
  return [
    {title: 'Schwankie.com'},
    {name: 'description', content: 'Schwankie.com - an alternative memory'},
  ];
};

export async function loader() {
  const links = await loadLinks();

  return {
    links,
  };
}

export default function Index() {
  const {links} = useLoaderData();

  return (
    <div className="pb-5">
      <Navbar />
      <CardList links={links} />
    </div>
  );
}
