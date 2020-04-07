import {createReducer, PayloadAction} from '@reduxjs/toolkit';
import {AuthorizeUserActions, LoadUserFromStorageActions} from '../actions';
import {User} from '../types';

export type UserState = User | null;

const INITIAL: UserState = null;

export default createReducer(INITIAL, {
  [AuthorizeUserActions.UserAuthorized]: (state: UserState, action: PayloadAction<User>) =>
    action.payload,
  [LoadUserFromStorageActions.UserLoaded]: (state: UserState, action: PayloadAction<User>) =>
    action.payload,
});
