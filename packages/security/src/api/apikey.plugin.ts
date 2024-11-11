import {Elysia} from 'elysia';
import {InjectIn} from 'injectx';
import type {SecurityDependencies} from '../Types';

const validateToken = InjectIn(function ({apiKey}: SecurityDependencies) {
  return function (token: string | null | undefined) {
    if (!token) {
      return false;
    }

    return token === `Bearer ${apiKey}`;
  };
});

export const ApiKeyPlugin = new Elysia().onBeforeHandle({}, ({request: {headers}}) => {
  return validateToken(headers.get('Authorization'));
});
