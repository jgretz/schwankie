import {get} from '@truefit/http-utils';
import {Dispatch} from 'redux';
import {startLoading, linksLoaded, stopLoading} from './loading';

export const loadLinksForSearch = (query: string) => async (dispatch: Dispatch) => {
  dispatch(startLoading());

  try {
    const response = await get(`links/search?query=${query}`);
    dispatch(linksLoaded(response.data));
  } finally {
    dispatch(stopLoading());
  }
};
