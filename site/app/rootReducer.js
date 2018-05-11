/* eslint-disable sort-imports */
/* eslint-disable camelcase */
/* eslint-disable object-shorthand */
import {combineReducers} from 'redux';
import {routerReducer} from 'react-router-redux';
import bar from './features/bar/reducers';

const rootReducer = combineReducers({
  features: combineReducers({
    bar: bar,
  }),
  router: routerReducer,
});

export default rootReducer;
