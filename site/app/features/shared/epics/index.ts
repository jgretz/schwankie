import {combineEpics} from 'redux-observable';
import {onReduxInit} from './onReduxInit';

export default combineEpics(onReduxInit);
