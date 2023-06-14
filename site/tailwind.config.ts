import type {Config} from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        smoky_black: {
          DEFAULT: '#0f1108ff',
        },
        palatinate: {
          DEFAULT: '#4c1e4fff',
        },
        caribbean_current: {
          DEFAULT: '#246a73ff',
        },
        dark_cyan: {
          DEFAULT: '#368f8bff',
        },
        champagne: {
          DEFAULT: '#f3dfc1ff',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
