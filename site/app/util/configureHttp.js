import {configureHttp as httpConfigure} from 'truefit-react-utils';

const DEFAULT_CONFIG = {
  baseURL: process.env.API_BASE_URL,
};

// The inner function is where you add the logic to pass up credentials
export const configureHttp = store => httpConfigure(() => DEFAULT_CONFIG); // eslint-disable-line
