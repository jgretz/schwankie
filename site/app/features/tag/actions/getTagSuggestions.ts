import {get} from '@truefit/http-utils';
import {createAction, Dispatch} from '@reduxjs/toolkit';
import {Tag} from '../types';

export enum GetTagSuggestionsActions {
  SuggestionsReceived = 'TAGS/SUGGESTIONS_RECEIVED',
}

const tagSuggestionsReceived = createAction<Tag[]>(GetTagSuggestionsActions.SuggestionsReceived);

export const getTagSuggestions = (term: string) => async (dispatch: Dispatch) => {
  const response = await get<Tag[]>(`tags/startsWith?term=${term}`);

  dispatch(tagSuggestionsReceived(response.data));
};
