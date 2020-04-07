import {combineEpics} from 'redux-observable';
import {loadLinksOnAppInitialized} from './loadLinksOnAppInitialized';

export default combineEpics(loadLinksOnAppInitialized);
