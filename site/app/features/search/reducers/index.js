/* eslint-disable sort-imports */
import {combineReducers} from 'redux';
import links from './links.js';
import source from './source.js';

export default combineReducers({
  links,
  source,
});
