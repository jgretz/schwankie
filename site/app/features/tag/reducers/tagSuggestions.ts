import {createReducer, PayloadAction} from '@reduxjs/toolkit';
import {Tag} from '../types';
import {GetTagSuggestionsActions} from '../actions';

export type TagSuggestionsState = Tag[];

const INITIAL = new Array<Tag>();

export default createReducer(INITIAL, {
  [GetTagSuggestionsActions.SuggestionsReceived]: (
    state: TagSuggestionsState,
    action: PayloadAction<Tag[]>,
  ) => action.payload,
});
