/* eslint-disable sort-imports */
import {combineReducers} from 'redux';
import searchTerm, {SearchTermState} from './searchTerm';

export type SearchState = {
  searchTerm: SearchTermState;
};

export default combineReducers({
  searchTerm,
});
