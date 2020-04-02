import {PayloadAction} from '@reduxjs/toolkit';
import {Action} from 'redux';
import {ofType, Epic} from 'redux-observable';

import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {SetSearchTermActions} from '../../search/actions';
import {loadLinksForSearch, loadRecentLinks} from '../actions';

export const loadLinksForSearchTerm: Epic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(SetSearchTermActions.SearchTermSet),
    map((action: PayloadAction<string>) => {
      if (action.payload.length > 0) {
        return loadLinksForSearch(action.payload);
      }

      return loadRecentLinks();
    }),
  );
