export const UPDATE_LINK_FORM = 'UPDATE_LINK_FORM';

export const updateLinkForm = (field, value) => ({
  type: UPDATE_LINK_FORM,
  payload: {field, value},
});
