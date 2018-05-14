import {configureHttp as httpConfigure} from 'truefit-react-utils';
import {tokenSelector} from '../features/admin/selectors';

const DEFAULT_CONFIG = {
  baseURL: process.env.API_BASE_URL,
};

// The inner function is where you add the logic to pass up credentials
export const configureHttp = store => httpConfigure(() => {
  const token = tokenSelector(store.getState());

  if (!token) {
    return DEFAULT_CONFIG;
  }

  return {
    ...DEFAULT_CONFIG,
    headers: {
      Authorization: token,
    },
  };
});
