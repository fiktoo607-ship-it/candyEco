import type { Config } from 'tailwindcss';
import { THEME_CONFIG } from './lib/theme';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: THEME_CONFIG.colors,
      borderRadius: THEME_CONFIG.borderRadius,
      spacing: THEME_CONFIG.spacing,
      fontFamily: THEME_CONFIG.fonts,
      boxShadow: THEME_CONFIG.boxShadow,
      screens: {
        desktop: '1300px',
      },
    }
  },
  plugins: []
};

export default config;