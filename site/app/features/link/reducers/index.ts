/* eslint-disable sort-imports */
import {combineReducers} from 'redux';
import links, {LinksState} from './links';
import loading, {LoadingState} from './loading';

export type LinkState = {
  links: LinksState;
  loading: LoadingState;
};

export default combineReducers({
  links,
  loading,
});
