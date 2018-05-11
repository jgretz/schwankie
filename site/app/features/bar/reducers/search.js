import {stateReducer} from 'truefit-react-utils';
import {UPDATE_SEARCH} from '../actions';

export default stateReducer('', {
  [UPDATE_SEARCH]: (_, payload) => payload,
});



