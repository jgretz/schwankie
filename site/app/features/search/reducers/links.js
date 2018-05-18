import {stateReducer} from 'truefit-react-utils';
import {
  RANDOM_LINKS_LOADED,
  RECENT_LINKS_LOADED,
  LINKS_LOADED,
} from '../actions';

export default stateReducer([], {
  [RANDOM_LINKS_LOADED]: (_, payload) => payload,
  [RECENT_LINKS_LOADED]: (_, payload) => payload,
  [LINKS_LOADED]: (_, payload) => payload,
});
