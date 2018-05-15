import {Record} from 'immutable';
import {stateReducer} from 'truefit-react-utils';
import {
  UPDATE_LINK_FORM,
  LINK_FOUND,
  LINK_REMOVED,
  LINK_SAVED,
} from '../actions';

const Link = Record({
  id: null,
  url: '',
  title: '',
  description: '',
  tags: '',
  image: '',
});

export default stateReducer(new Link(), {
  [UPDATE_LINK_FORM]: (state, payload) =>
    state.set(payload.field, payload.value),
  [LINK_FOUND]: (_, payload) => new Link(payload),
  [LINK_REMOVED]: () => new Link(),
  [LINK_SAVED]: (_, payload) => new Link(payload),
});
