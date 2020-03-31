import {createReducer, PayloadAction} from '@reduxjs/toolkit';
import {LinksLoadingActions} from '../actions';
import {Link} from '../types';

export type LinksState = Link[];

const INITIAL = new Array<Link>();

export default createReducer(INITIAL, {
  [LinksLoadingActions.LinksLoaded]: (_, action: PayloadAction<Link[]>) => action.payload,
});
