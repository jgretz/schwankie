import type {Config} from 'tailwindcss';
import {createThemes} from 'tw-colors';

export default {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}'],
  plugins: [
    createThemes({
      light: {
        background: '#EAE7DC',
        primary: '#007CB9',
        secondary: '#33A8D6',
        accent: '#1A8DBF',
        text: '#fff',
      },
      dark: {
        background: '#1D3557',
        primary: '#457B9D',
        secondary: '#457B9D',
        accent: '#A8DADC',
        text: '#000',
      },
    }),
  ],
} satisfies Config;
