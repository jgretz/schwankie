/* eslint-disable sort-imports */
/* eslint-disable camelcase */
/* eslint-disable object-shorthand */
import {combineReducers} from 'redux';

import link, {LinkState} from './features/link/reducers';
import search, {SearchState} from './features/search/reducers';
import tag, {TagState} from './features/tag/reducers';

export type ApplicationState = {
  features: {
    link: LinkState;
    search: SearchState;
    tag: TagState;
  };
};

const createRootReducer = () =>
  combineReducers({
    features: combineReducers({
      link: link,
      search: search,
      tag: tag,
    }),
  });

export default createRootReducer;
