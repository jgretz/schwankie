/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable global-require */

import {configureStore} from '@reduxjs/toolkit';
import thunkMiddleware from 'redux-thunk';
import asyncAwaitMiddleware from 'redux-async-await';
import {createEpicMiddleware} from 'redux-observable';

import {BehaviorSubject} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import createRootReducer from '../rootReducer';
import rootEpic from '../rootEpic';

// scaffolding
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const epicMiddleware = createEpicMiddleware();
const middleware = [thunkMiddleware, asyncAwaitMiddleware, epicMiddleware];
const reducer = createRootReducer();

// export configure func
export default () => {
  const store = configureStore({
    reducer,
    middleware,

    devTools: IS_PRODUCTION || {
      name: 'Schwankie.com',
    },
  });

  if (module.hot) {
    // redux
    module.hot.accept('../rootReducer', () => {
      const newRootReducer = require('../rootReducer').default;
      store.replaceReducer(newRootReducer);
    });

    // redux observable
    const hrEpic$ = new BehaviorSubject(rootEpic);
    const hotReloadingEpic = (action: any, state: any, dependencies: any) =>
      hrEpic$.pipe(switchMap((epic) => epic(action, state, dependencies)));

    epicMiddleware.run(hotReloadingEpic);

    module.hot.accept('../rootEpic', () => {
      const newRootEpic = require('../rootEpic').default;
      hrEpic$.next(newRootEpic);
    });
  } else {
    epicMiddleware.run(rootEpic);
  }

  return store;
};
