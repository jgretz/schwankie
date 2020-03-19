/* eslint-disable global-require */
import {configureStore} from '@reduxjs/toolkit';
import thunkMiddleware from 'redux-thunk';
import asyncAwaitMiddleware from 'redux-async-await';
import createRootReducer from '../rootReducer';

// scaffolding
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const middleware = [thunkMiddleware, asyncAwaitMiddleware];
const reducer = createRootReducer();

// export configure func
export default () => {
  const store = configureStore({
    reducer,
    middleware,

    // TODO: rename the name to your app
    devTools: IS_PRODUCTION || {
      name: 'Truefit React Template',
    },
  });

  if (module.hot) {
    module.hot.accept('../rootReducer', () => {
      const newRootReducer = require('../rootReducer').default;
      store.replaceReducer(newRootReducer);
    });
  }

  return store;
};
