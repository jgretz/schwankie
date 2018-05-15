/* eslint-disable sort-imports */
/* eslint-disable camelcase */
/* eslint-disable object-shorthand */
import {combineReducers} from 'redux';
import {routerReducer} from 'react-router-redux';
import search from './features/search/reducers';
import admin from './features/admin/reducers';
import bar from './features/bar/reducers';

const rootReducer = combineReducers({
  features: combineReducers({
    search: search,
    admin: admin,
    bar: bar,
  }),
  router: routerReducer,
});

export default rootReducer;
