import {useLoaderData} from '@remix-run/react';
import type {IndexLoaderData} from '~/Types';
import {Card} from './card';

export function LinkList() {
  const {links} = useLoaderData<IndexLoaderData>();

  // start here for load more
  return (
    <div>
      <div className="flex flex-col justify-start items-center w-full mx-0.5 xl:w-3/4 xl:mx-auto">
        {links.map((link) => (
          <Card key={link.id} link={link} />
        ))}
      </div>
    </div>
  );
}
