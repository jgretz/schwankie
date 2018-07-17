import {post} from 'truefit-react-utils';

export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAILURE = 'LOGIN_FAILURE';

export const login = async auth => {
  try {
    const response = await post('auth', auth);

    return {
      type: LOGIN_SUCCESS,
      payload: response.data,
    };
  } catch (err) {
    return {
      type: LOGIN_FAILURE,
    };
  }
};
