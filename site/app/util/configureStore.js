import promiseMiddlware from 'redux-promise-middleware';
import thunkMiddleware from 'redux-thunk';
import asyncAwaitMiddleware from 'redux-async-await';
import {applyMiddleware, createStore} from 'redux';
import {routerMiddleware} from 'react-router-redux';
import rootReducer from '../rootReducer';

const PRODUCTION = process.env.NODE_ENV === 'production';

const createProductionStore = middleware =>
  createStore(rootReducer, applyMiddleware(...middleware));

const createDevStore = middleware => {
  const composeWithDevTools = require('redux-devtools-extension')
    .composeWithDevTools;

  const store = createStore(
    rootReducer,
    composeWithDevTools(applyMiddleware(...middleware)),
  );

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../rootReducer', () => {
      const nextReducer = require('../rootReducer').default;
      store.replaceReducer(nextReducer);
    });
  }

  return store;
};

export const configureStore = history => {
  const middleware = [
    thunkMiddleware,
    promiseMiddlware(),
    asyncAwaitMiddleware,
    routerMiddleware(history),
  ];

  return PRODUCTION
    ? createProductionStore(middleware)
    : createDevStore(middleware);
};
