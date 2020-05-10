/* eslint-disable no-console */
import {createAction, Dispatch} from '@reduxjs/toolkit';
import {post} from '@truefit/http-utils';
import {User} from '../types';

export enum AuthorizeUserActions {
  UserAuthorized = 'ADMIN/USER_AUTHORIZED',
  AuthorizationFailed = 'ADMIN/AUTHORIZATION_FAILED',
}

const userAuthorized = createAction<User>(AuthorizeUserActions.UserAuthorized);
const authorizationFailed = createAction(AuthorizeUserActions.AuthorizationFailed);

export const authorizeUser = (username: string, password: string) => async (dispatch: Dispatch) => {
  try {
    const response = await post<string>('user/authorize', {username, password});
    if (response.data.length === 0) {
      console.log('Authorization failed');
      dispatch(authorizationFailed());
      return;
    }

    dispatch(userAuthorized({token: response.data}));
  } catch {
    console.log('Authorization failed');
    dispatch(authorizationFailed());
  }
};
