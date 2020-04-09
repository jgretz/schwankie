import {get} from '@truefit/http-utils';
import {Dispatch} from 'redux';
import {startLoading, linksLoaded, stopLoading} from './loading';
import {PAGE_SIZE} from '../constants';

export const loadRecentLinks = () => async (dispatch: Dispatch) => {
  dispatch(startLoading());

  try {
    const response = await get(`links/recent?count=${PAGE_SIZE}`);
    dispatch(linksLoaded(response.data));
  } finally {
    dispatch(stopLoading());
  }
};
