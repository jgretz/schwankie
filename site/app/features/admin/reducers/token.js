import {stateReducer} from 'truefit-react-utils';
import {LOGIN_SUCCESS, TOKEN_LOADED, TOKEN_LOAD_FAILED} from '../actions';
import {TOKEN} from '../../shared/constants';

export default stateReducer(null, {
  [LOGIN_SUCCESS]: (_, payload) => {
    localStorage.setItem(TOKEN, payload.token);
    return payload.token;
  },

  [TOKEN_LOADED]: (_, payload) => payload,

  [TOKEN_LOAD_FAILED]: () => {
    localStorage.removeItem(TOKEN);
    return null;
  },
});
