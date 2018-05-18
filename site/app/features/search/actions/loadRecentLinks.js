import {get} from 'truefit-react-utils';

export const RECENT_LINKS_LOADED = 'RECENT_LINKS_LOADED';

export const loadRecentLinks = async () => {
  const response = await get(
    `links?recent=25&t=${new Date().getMilliseconds()}`,
  );

  return {
    type: RECENT_LINKS_LOADED,
    payload: response.data,
  };
};
