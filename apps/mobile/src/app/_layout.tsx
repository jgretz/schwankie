import {useEffect} from 'react';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {init} from 'client';
import {setSharedApiKey, setSharedApiUrl} from '../services/shared-storage';

const queryClient = new QueryClient();

const apiUrl = process.env.EXPO_PUBLIC_API_URL;
const apiKey = process.env.EXPO_PUBLIC_API_KEY;

if (!apiUrl) {
  throw new Error('EXPO_PUBLIC_API_URL not set');
}

init({
  apiUrl,
  apiKey,
});

export default function RootLayout() {
  useEffect(function () {
    setSharedApiUrl(apiUrl!);
    if (apiKey) setSharedApiKey(apiKey);
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{headerShown: false}} />
        <StatusBar style="auto" />
        <Toast />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
