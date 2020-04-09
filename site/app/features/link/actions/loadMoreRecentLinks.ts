import {get} from '@truefit/http-utils';
import {Dispatch} from 'redux';
import {moreLinksLoaded} from './loading';

export const loadMoreRecentLinks = (count = 25, page = 0) => async (dispatch: Dispatch) => {
  const response = await get(`links/recent?count=${count}&page=${page}`);
  dispatch(moreLinksLoaded(response.data));
};
