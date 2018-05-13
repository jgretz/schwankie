/* eslint-disable sort-imports */
import {combineReducers} from 'redux';
import auth from './auth.js';
import token from './token.js';

export default combineReducers({
  auth,
  token,
});
