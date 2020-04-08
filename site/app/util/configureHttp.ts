/* eslint-disable @typescript-eslint/no-explicit-any */
import {configureHttp as configure} from '@truefit/http-utils';
import {Store} from 'redux';
import {userSelector} from '../features/admin/selectors';

export default (store: Store): void => {
  configure({
    baseConfig: {
      baseURL: process.env.API_BASE_URL,
    },
    transformHeaders: (headers: any): any => {
      const user = userSelector(store.getState());

      return {
        ...headers,
        token: user?.token,
      };
    },
  });
};
