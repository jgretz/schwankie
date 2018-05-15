import {get} from 'truefit-react-utils';

export const LINKS_LOADED = 'LINKS_LOADED';

export const searchForLinks = async search => {
  const response = await get(
    `links?search=${search}&t=${new Date().getMilliseconds()}`,
  );

  return {
    type: LINKS_LOADED,
    payload: response.data,
  };
};
