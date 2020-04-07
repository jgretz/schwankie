import {combineEpics} from 'redux-observable';
import {writeUserStorage} from './writeUserToStorage';
import {loadUserFromStorage} from './loadUserFromStorage';

export default combineEpics(writeUserStorage, loadUserFromStorage);
