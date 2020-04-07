/* eslint-disable sort-imports */
/* eslint-disable camelcase */
/* eslint-disable object-shorthand */
import {combineReducers} from 'redux';

import admin, {AdminState} from './features/admin/reducers';
import link, {LinkState} from './features/link/reducers';
import search, {SearchState} from './features/search/reducers';
import tag, {TagState} from './features/tag/reducers';

export type ApplicationState = {
  features: {
    admin: AdminState;
    link: LinkState;
    search: SearchState;
    tag: TagState;
  };
};

const createRootReducer = () =>
  combineReducers({
    features: combineReducers({
      admin: admin,
      link: link,
      search: search,
      tag: tag,
    }),
  });

export default createRootReducer;
