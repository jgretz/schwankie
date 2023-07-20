import {Separator} from '~/components/separator';
import {useLoaderData} from '@remix-run/react';
import type {IndexLoaderData} from '~/Types';
import {TagList} from './tag_list';

export function TagPane() {
  const {mainTags, topTags, recentTags} = useLoaderData<IndexLoaderData>();

  return (
    <div className="mt-5">
      <Separator />
      <div className="flex justify-between mt-5 mx-3 xl:mx-5">
        <TagList title="Main Tags" items={mainTags} />
        <Separator orientation="vertical" />
        <TagList title="Top Tags" items={topTags} />
        <Separator orientation="vertical" />
        <TagList title="Most Recent Tags" items={recentTags} />
      </div>
    </div>
  );
}
