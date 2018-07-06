import {stateReducer} from 'truefit-react-utils';
import {Record} from 'immutable';
import {LINKS_LOADING, LINKS_LOADED} from '../actions';

const Links = Record({
  loading: false,
  items: [],
});

export default stateReducer(new Links(), {
  [LINKS_LOADING]: state => state.set('loading', true),

  [LINKS_LOADED]: (state, payload) =>
    state.withMutations(x => {
      x.set('loading', false);
      x.set('items', payload);
    }),
});
