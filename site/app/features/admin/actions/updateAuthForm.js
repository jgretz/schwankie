export const UPDATE_AUTH_FORM = 'UPDATE_AUTH_FORM';

export const updateAuthForm = (field, value) => ({
  type: UPDATE_AUTH_FORM,
  payload: {field, value},
});
