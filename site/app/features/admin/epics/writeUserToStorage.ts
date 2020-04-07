import {PayloadAction} from '@reduxjs/toolkit';
import {Action} from 'redux';
import {ofType, Epic} from 'redux-observable';

import {Observable} from 'rxjs';
import {tap, ignoreElements} from 'rxjs/operators';

import {AuthorizeUserActions} from '../actions';
import {USER_TOKEN} from '../constants';
import {User} from '../types';

export const writeUserStorage: Epic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(AuthorizeUserActions.UserAuthorized),
    tap((action: PayloadAction<User>) => {
      localStorage.setItem(USER_TOKEN, action.payload.token);
    }),
    ignoreElements(),
  );
