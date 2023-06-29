import {Card} from '~/components/card/card';
import {useLoaderData} from '@remix-run/react';
import type {IndexLoaderData} from '~/Types';

export function LinkList() {
  const {links} = useLoaderData<IndexLoaderData>();

  // start here for load more
  return (
    <div>
      <div className="flex flex-col justify-start items-center mx-auto w-3/4">
        {links.map((link) => (
          <Card key={link.id} link={link} />
        ))}
      </div>
    </div>
  );
}
