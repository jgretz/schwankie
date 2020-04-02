import {Action} from 'redux';
import {ofType, Epic} from 'redux-observable';

import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {APP_INITIALIZED} from '../constants';
import {loadRecentLinks} from '../../link/actions';

export const onReduxInit: Epic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(APP_INITIALIZED),
    map(() => {
      return loadRecentLinks();
    }),
  );
