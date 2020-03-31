import {createReducer} from '@reduxjs/toolkit';
import {LinksLoadingActions} from '../actions';

export type LoadingState = boolean;

export default createReducer(false, {
  [LinksLoadingActions.StartLoading]: () => true,
  [LinksLoadingActions.StopLoading]: () => false,
});
