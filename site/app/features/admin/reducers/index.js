/* eslint-disable sort-imports */
import {combineReducers} from 'redux';
import auth from './auth.js';
import link from './link.js';
import token from './token.js';

export default combineReducers({
  auth,
  link,
  token,
});
