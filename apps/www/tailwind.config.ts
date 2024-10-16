import type {Config} from 'tailwindcss';
import {createThemes} from 'tw-colors';

export default {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}'],
  plugins: [
    createThemes({
      light: {
        background: '#F7F7F5',
        primary: '#3B82F6',
        accent: '#F59E0B',
        text: '#1F2937',
      },
      dark: {
        background: '#1E293B',
        primary: '#60A5FA',
        accent: '#FBBF24',
        text: '#F9FAFB',
      },
    }),
  ],
} satisfies Config;
