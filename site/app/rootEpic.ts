import {combineEpics} from 'redux-observable';
import adminEpics from './features/admin/epics';
import linkEpics from './features/link/epics';
import sharedEpics from './features/shared/epics';

export default combineEpics(adminEpics, linkEpics, sharedEpics);
