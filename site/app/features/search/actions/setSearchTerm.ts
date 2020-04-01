import {createAction} from '@reduxjs/toolkit';

export enum SetSearchTermActions {
  SearchTermSet = 'SEARCH/TERM_SET',
}

const searchTermSet = createAction<string>(SetSearchTermActions.SearchTermSet);

export const setSearchTerm = (term: string) => searchTermSet(term);
