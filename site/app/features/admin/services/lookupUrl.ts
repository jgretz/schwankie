import {get} from '@truefit/http-utils';
import {Link} from '../../link/types';

export default async (url: string) => {
  const response = await get<Link>(`links?url=${url}`);

  return response.data;
};
