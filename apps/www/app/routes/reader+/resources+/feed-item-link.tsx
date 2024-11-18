import type {ActionFunctionArgs} from '@remix-run/node';
import {useFetcher} from '@remix-run/react';
import {markAsClicked} from '@www/services/rss/markAsClicked.post';
import {useCallback} from 'react';
import type {RssFeedItem} from 'rss';

interface Props {
  item: RssFeedItem;
}

export async function action({request}: ActionFunctionArgs) {
  const {id} = await request.json();
  await markAsClicked(id);

  return {};
}

export function FeedItemLink({item}: Props) {
  const fetcher = useFetcher();

  const handleClick = useCallback(() => {
    fetcher.submit(JSON.stringify({id: item.id}), {
      action: '/reader/resources/feed-item-link',
      method: 'POST',
      encType: 'application/json',
    });
  }, [fetcher, item.id]);

  return (
    <a href={item.link} target="__blank" onClick={handleClick} onContextMenu={handleClick}>
      <h2 className="font-bold text-lg text-text">{item.title}</h2>
    </a>
  );
}
