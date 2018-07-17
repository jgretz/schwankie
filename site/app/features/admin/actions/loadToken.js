import {get} from 'truefit-react-utils';
import {TOKEN} from '../../shared/constants';

export const TOKEN_LOADED = 'TOKEN_LOADED';
export const TOKEN_LOAD_FAILED = 'TOKEN_LOAD_FAILED';

export const loadToken = async () => {
  const token = localStorage.getItem(TOKEN);
  if (!token) {
    return {
      type: TOKEN_LOAD_FAILED,
    };
  }

  try {
    const result = await get('/tokentest', {}, {Authorization: token});
    if (result.data) {
      return {
        type: TOKEN_LOADED,
        payload: token,
      };
    }
  } catch (err) {
    console.error(err); // eslint-disable-line
  }

  return {
    type: TOKEN_LOAD_FAILED,
  };
};
