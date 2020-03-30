/* eslint-disable sort-imports */
import {combineReducers} from 'redux';
import tagSuggestions, {TagSuggestionsState} from './tagSuggestions';

export type TagState = {
  tagSuggestions: TagSuggestionsState;
};

export default combineReducers({
  tagSuggestions,
});
