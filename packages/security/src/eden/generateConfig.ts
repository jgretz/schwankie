import {InjectIn} from 'injectx';
import type {SecurityDependencies} from '../Types';

export const generateConfig = InjectIn(function ({apiKey}: SecurityDependencies) {
  return function () {
    return {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    };
  };
});
