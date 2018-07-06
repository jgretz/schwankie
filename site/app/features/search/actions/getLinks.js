import {get} from 'truefit-react-utils';

export const LINKS_LOADING = 'LINKS_LOADING';
export const LINKS_LOADED = 'LINKS_LOADED';

const buildUrlFromOptions = ({random = false, recent = false, term = null}) => {
  const parts = ['links?'];

  if (random) {
    parts.push('random=true&');
  }

  if (recent) {
    parts.push('recent=25&');
  }

  if (term) {
    parts.push(`search=${term}&`);
  }

  parts.push(`&t=${new Date().getMilliseconds()}`);

  return parts.join('');
};

const loadLinks = async options => {
  const url = buildUrlFromOptions(options);
  const response = await get(url);

  return {
    type: LINKS_LOADED,
    payload: response.data,
  };
};

export const getLinks = options => dispatch => {
  dispatch({type: LINKS_LOADING});
  dispatch(loadLinks(options));
};
