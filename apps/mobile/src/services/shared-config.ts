import Constants from 'expo-constants';
import { init } from 'client';

let initialized = false;

export async function ensureClientInit(): Promise<void> {
  if (initialized) return;

  const apiUrl =
    Constants.expoConfig?.extra?.apiUrl ||
    process.env.EXPO_PUBLIC_API_URL ||
    'https://api.schwankie.com';
  const apiKey = process.env.EXPO_PUBLIC_API_KEY;

  if (!apiKey) {
    throw new Error('EXPO_PUBLIC_API_KEY is not set');
  }

  init({
    apiUrl,
    apiKey,
  });

  initialized = true;
}
