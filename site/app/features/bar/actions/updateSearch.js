export const UPDATE_SEARCH = 'UPDATE_SEARCH';

export const updateSearch = event => ({
  type: UPDATE_SEARCH,
  payload: event.target.value,
});
