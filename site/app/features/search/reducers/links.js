import {stateReducer} from 'truefit-react-utils';
import {RECENT_LINKS_LOADED, LINKS_LOADED} from '../actions';

export default stateReducer([], {
  [RECENT_LINKS_LOADED]: (_, payload) => payload,
  [LINKS_LOADED]: (_, payload) => payload,
});
