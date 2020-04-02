import {combineEpics} from 'redux-observable';
import {loadLinksForSearchTerm} from './loadLinksForSearchTerm';

export default combineEpics(loadLinksForSearchTerm);
