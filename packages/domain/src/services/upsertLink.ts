import {linkInsert, linkUpdate} from '../commands';
import {linkByUrlQuery} from '../queries';

interface LinkUpsert {
  id?: number | undefined;
  url: string;
  title: string;
  description?: string | null | undefined;
  imageUrl?: string | null | undefined;
  tags?:
    | string
    | number
    | boolean
    | any[]
    | {
        [x: string]: any;
      }
    | null
    | undefined;
}

async function updateLink(link: LinkUpsert) {
  return await linkUpdate({
    id: link.id!,
    url: link.url,
    title: link.title,
    description: link.description || undefined,
    imageUrl: link.imageUrl || undefined,
    tags: (link.tags as string).split(',') || undefined,
  });
}

export async function upsertLink(link: LinkUpsert) {
  // known update
  if (link.id) {
    return await updateLink(link);
  }

  // tried to get tricky - url has to be unique
  const checkUrlForLink = await linkByUrlQuery({url: link.url});
  if (checkUrlForLink) {
    return await updateLink({...link, id: checkUrlForLink.id});
  }

  // new link
  return await linkInsert({
    url: link.url,
    title: link.title,
    description: link.description || undefined,
    imageUrl: link.imageUrl || undefined,
    tags: (link.tags as string).split(',') || undefined,
  });
}
