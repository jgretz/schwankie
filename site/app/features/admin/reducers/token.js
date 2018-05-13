import {stateReducer} from 'truefit-react-utils';
import {LOGIN_SUCESS} from '../actions';

const TOKEN = 'TOKEN';

export default stateReducer(localStorage.getItem(TOKEN), {
  [LOGIN_SUCESS]: (_, payload) => {
    localStorage.setItem(TOKEN, payload.token);
    return payload.token;
  },
});
