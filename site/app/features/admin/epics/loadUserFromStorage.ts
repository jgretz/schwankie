import {Action} from 'redux';
import {ofType, Epic} from 'redux-observable';

import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {APP_INITIALIZED} from '../../shared/constants';
import {loadUserFromStorage as loadUserFromStorageAction} from '../actions';

export const loadUserFromStorage: Epic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(APP_INITIALIZED),
    map(() => {
      return loadUserFromStorageAction();
    }),
  );
