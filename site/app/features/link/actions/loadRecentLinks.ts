import {get} from '@truefit/http-utils';
import {Dispatch} from 'redux';
import {startLoading, linksLoaded, stopLoading} from './loading';

export const loadRecentLinks = () => async (dispatch: Dispatch) => {
  dispatch(startLoading());

  try {
    const response = await get('links/recent');
    dispatch(linksLoaded(response.data));
  } finally {
    dispatch(stopLoading());
  }
};
