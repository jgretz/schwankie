import type {Config} from 'tailwindcss';
import {createThemes} from 'tw-colors';

export default {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}'],
  plugins: [
    createThemes({
      light: {
        background: '#D8C3A5',
        primary: '#B99A75',
        secondary: '#8D8D8A',
        accent: '#A6A57A',
        text: '#EAE7DC',
      },
      dark: {
        background: '#1D3557',
        primary: '#457B9D',
        secondary: '#A8DADC',
        accent: '#A8A7C7',
        text: '#F1FAEE',
      },
    }),
  ],
} satisfies Config;
