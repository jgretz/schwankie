import {configureHttp as configure} from '@truefit/http-utils';
import {Store} from 'redux';

export default (store: Store): void => {
  configure({
    baseConfig: {
      baseURL: process.env.API_BASE_URL,
    },
  });
};
