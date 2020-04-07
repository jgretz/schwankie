import {createAction, Dispatch} from '@reduxjs/toolkit';
import {User} from '../types';
import {USER_TOKEN} from '../constants/storage';

export enum LoadUserFromStorageActions {
  UserLoaded = 'ADMIN/USER_LOADED',
}

const tokenLoaded = createAction<User>(LoadUserFromStorageActions.UserLoaded);

export const loadUserFromStorage = () => async (dispatch: Dispatch) => {
  const token = localStorage.getItem(USER_TOKEN);

  if (token) {
    dispatch(tokenLoaded({token}));
  }
};
