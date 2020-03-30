/* eslint-disable sort-imports */
/* eslint-disable camelcase */
/* eslint-disable object-shorthand */
import {combineReducers} from 'redux';

import link, {LinkState} from './features/link/reducers';
import tag, {TagState} from './features/tag/reducers';

export type ApplicationState = {
  features: {
    link: LinkState;
    tag: TagState;
  };
};

const createRootReducer = () =>
  combineReducers({
    features: combineReducers({
      link: link,
      tag: tag,
    }),
  });

export default createRootReducer;
