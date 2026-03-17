import {init} from 'client';

let initialized = false;

export function initClient() {
  if (initialized) return;
  initialized = true;

  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
  init({apiUrl});
}
