import {OptionsObject, SnackbarKey, SnackbarMessage, useSnackbar} from 'notistack';

const SNACKBAR_METHODS = ['enqueueSnackbar', 'closeSnackbar'];

export enum EnqueueSnackbarVariant {
  Default = 'default',
  Error = 'error',
  Success = 'success',
  Warning = 'warning',
  Info = 'info',
}

export type EnqueueSnackbarFunction = (
  message: SnackbarMessage,
  options?: OptionsObject,
) => SnackbarKey;

export default () => () => {
  return {
    dependencies: {
      useSnackbar,
    },
    initialize: `const {${SNACKBAR_METHODS.join(', ')}} = useSnackbar();`,
    props: SNACKBAR_METHODS,
  };
};
