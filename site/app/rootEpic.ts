import {combineEpics} from 'redux-observable';
import linkEpics from './features/link/epics';
import sharedEpics from './features/shared/epics';

export default combineEpics(linkEpics, sharedEpics);
