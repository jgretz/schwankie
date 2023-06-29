import {Separator} from '~/components/ui/separator';
import {Link, useFetcher} from '@remix-run/react';
import {loadMainTags} from '~/services/api/loadMainTags';
import {loadTopTags} from '~/services/api/loadTopTags';
import {loadRecentTags} from '~/services/api/loadRecentTags';
import type {TagListItem} from '~/Types';
import {json} from '@remix-run/node';
import {useResourceRouteFetcher} from '~/hooks/useResourceRouteFetcher';

const ROUTE = '/resources/tags_list';

interface ListProps {
  title: string;
  items: TagListItem[];
}

export async function loader() {
  const mainTags = await loadMainTags();
  const topTags = await loadTopTags();
  const recentTags = await loadRecentTags();

  return json({
    mainTags,
    topTags,
    recentTags,
  });
}

export function TagsList() {
  const tagsFetcher = useFetcher<typeof loader>();
  const {mainTags, topTags, recentTags} = tagsFetcher.data || {
    mainTags: [],
    topTags: [],
    recentTags: [],
  };

  useResourceRouteFetcher<typeof loader>(tagsFetcher, ROUTE);

  return (
    <div className={`m-5`}>
      <Separator />
      <div className="flex justify-between m-5">
        <Tags title="Main Tags" items={mainTags} />
        <Separator orientation="vertical" />
        <Tags title="Top Tags" items={topTags} />
        <Separator orientation="vertical" />
        <Tags title="Most Recent Tags" items={recentTags} />
      </div>
    </div>
  );
}

function Tags({title, items}: ListProps) {
  return (
    <div className="flex flex-col items-center flex-1">
      <h2 className="font-bold mb-2">{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Link to={`?query=${item.text}`} className="flex items-center">
              <div className={`bg-${item.color} rounded-full h-[10px] w-[10px] mr-5`}></div>
              {item.text}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
