import {Record} from 'immutable';
import {stateReducer} from 'truefit-react-utils';
import {UPDATE_AUTH_FORM, CLEAR_AUTH_FORM} from '../actions';

const Auth = Record({
  user: '',
  password: '',
});

export default stateReducer(new Auth(), {
  [UPDATE_AUTH_FORM]: (state, payload) => state.set(payload.field, payload.value),
  [CLEAR_AUTH_FORM]: () => new Auth(),
});
