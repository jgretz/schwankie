import {post, put} from '@truefit/http-utils';
import {Link} from '../../link/types';

export default async (link: Link): Promise<Link> => {
  const command = link?.id && link.id.length > 0 ? put : post;
  const response = await command<Link>('links', link);

  return response.data;
};
