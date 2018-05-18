import {get} from 'truefit-react-utils';

export const RANDOM_LINKS_LOADED = 'RANDOM_LINKS_LOADED';

export const loadRandomLinks = async () => {
  const response = await get(
    `links?random=true&t=${new Date().getMilliseconds()}`,
  );

  return {
    type: RANDOM_LINKS_LOADED,
    payload: response.data,
  };
};
