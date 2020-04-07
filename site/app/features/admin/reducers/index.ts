/* eslint-disable sort-imports */
import {combineReducers} from 'redux';
import user, {UserState} from './user';

export type AdminState = {
  user: UserState;
};

export default combineReducers({
  user,
});
