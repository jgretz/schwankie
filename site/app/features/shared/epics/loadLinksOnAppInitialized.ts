import {Action} from 'redux';
import {ofType, Epic} from 'redux-observable';

import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {APP_INITIALIZED} from '../constants';
import {setSearchTerm} from '../../search/actions';
import {loadRecentLinks} from '../../link/actions';

export const loadLinksOnAppInitialized: Epic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(APP_INITIALIZED),
    map(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const search = urlParams.get('search');

      if (search) {
        return setSearchTerm(search);
      }

      return loadRecentLinks();
    }),
  );
