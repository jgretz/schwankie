/* eslint-disable sort-imports */
/* eslint-disable camelcase */
/* eslint-disable object-shorthand */
import {combineReducers} from 'redux';

import link, {LinkState} from './features/link/reducers';

export type ApplicationState = {
  features: {
    link: LinkState;
  };
};

const createRootReducer = () =>
  combineReducers({
    features: combineReducers({
      link: link,
    }),
  });

export default createRootReducer;
