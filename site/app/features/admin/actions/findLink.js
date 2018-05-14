import {get} from 'truefit-react-utils';

export const LINK_FOUND = 'LINK_FOUND';
export const LINK_NOT_FOUND = 'LINK_NOT_FOUND';

export const findLink = async url => {
  const response = await get(`links?url=${url}`);

  if (response.data.length === 0) {
    return {
      type: LINK_NOT_FOUND,
    };
  }

  const link = response.data[0];

  return {
    type: LINK_FOUND,
    payload: {
      ...link,
      tags: link.tags.join(', '),
    },
  };
};