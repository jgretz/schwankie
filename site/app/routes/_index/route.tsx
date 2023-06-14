import {useLoaderData} from '@remix-run/react';
import {CardList} from '~/components/card';
import {Navbar} from '~/components/navbar';
import {loadLinks} from '~/services';

export * from './meta';

export async function loader() {
  const links = await loadLinks();

  return {
    links,
  };
}

export default function Index() {
  const {links} = useLoaderData();

  return (
    <div className="bg-champagne pb-5">
      <Navbar />
      <CardList links={links} />
    </div>
  );
}
