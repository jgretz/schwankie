import {stateReducer} from 'truefit-react-utils';
import {SET_SOURCE} from '../actions';
import {SOURCE} from '../../shared/constants';

export default stateReducer(SOURCE.Random, {
  [SET_SOURCE]: (_, payload) => payload,
});
