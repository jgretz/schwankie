import {Separator} from '~/components/ui/separator';
import type {TagListItem} from '../../Types';
import {Link} from '@remix-run/react';

interface Props {
  mainTags: TagListItem[];
  topTags: TagListItem[];
  recentTags: TagListItem[];
}

interface ListProps {
  title: string;
  items: TagListItem[];
}

function TagList({title, items}: ListProps) {
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

export function Tags({mainTags, topTags, recentTags}: Props) {
  return (
    <div className={`m-5`}>
      <Separator />
      <div className="flex justify-between m-5">
        <TagList title="Main Tags" items={mainTags} />
        <Separator orientation="vertical" />
        <TagList title="Top Tags" items={topTags} />
        <Separator orientation="vertical" />
        <TagList title="Most Recent Tags" items={recentTags} />
      </div>
    </div>
  );
}
