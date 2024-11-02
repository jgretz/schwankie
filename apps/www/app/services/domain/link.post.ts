import {match} from 'ts-pattern';
import client from '../client';

interface LinkPost {
  url: string;
  title: string;
  id?: number | undefined;
  description?: string | undefined;
  tags?: string | undefined;
  imageUrl?: string | undefined;
}

export async function postLink(link: LinkPost) {
  const result = await client.api.links.index.post(link);

  return match(result.status)
    .with(200, () => result.data)
    .otherwise(() => {
      console.error(result.error?.value);
      return [];
    });
}
