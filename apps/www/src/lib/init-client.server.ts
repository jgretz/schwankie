import {init} from 'client';
import {getEnv} from './env.server';

let initialized = false;

export function initClientServer() {
  if (initialized) return;
  initialized = true;

  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
  init({apiUrl, apiKey: getEnv().API_KEY});
}
