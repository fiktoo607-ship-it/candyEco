import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'on-surface-variant': '#59413a',
        'secondary-container': '#ffaeda',
        surface: '#f8f9ff',
        'surface-container-lowest': '#ffffff',
        'on-tertiary-fixed': '#1b1c17',
        'on-tertiary-container': '#f1f0e8',
        'tertiary-fixed-dim': '#c8c7bf',
        'tertiary-fixed': '#e4e3db',
        'primary-container': '#c2410c',
        'error-container': '#ffdad6',
        'on-tertiary-fixed-variant': '#474742',
        'inverse-surface': '#27313f',
        'outline-variant': '#e1bfb5',
        'inverse-on-surface': '#eaf1ff',
        error: '#ba1a1a',
        tertiary: '#55554f',
        'surface-bright': '#f8f9ff',
        'surface-tint': '#ac3400',
        'inverse-primary': '#ffb59d',
        'on-background': '#121c2a',
        'on-primary-fixed': '#390c00',
        'on-secondary-fixed': '#3a0329',
        'tertiary-container': '#6d6d67',
        'on-secondary': '#ffffff',
        'on-error-container': '#93000a',
        'primary-fixed-dim': '#ffb59d',
        primary: '#9b2f00',
        outline: '#8d7168',
        'on-primary-container': '#ffece7',
        'surface-dim': '#d0dbed',
        'primary-fixed': '#ffdbd0',
        background: '#f8f9ff',
        secondary: '#8a486f',
        'surface-container-highest': '#d9e3f6',
        'on-tertiary': '#ffffff',
        'secondary-fixed-dim': '#ffaeda',
        'on-surface': '#121c2a',
        'on-error': '#ffffff',
        'on-primary': '#ffffff',
        'on-primary-fixed-variant': '#832600',
        'surface-container-low': '#eff4ff',
        'surface-variant': '#d9e3f6',
        'surface-container': '#e6eeff',
        'surface-container-high': '#dee9fc',
        'on-secondary-container': '#7c3d63',
        'secondary-fixed': '#ffd8ea',
        'on-secondary-fixed-variant': '#6f3157'
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px'
      },
      spacing: {
        xs: '4px',
        sm: '12px',
        md: '24px',
        lg: '48px',
        xl: '80px',
        gutter: '24px',
        'container-max': '1280px'
      },
      fontFamily: {
        body: ['var(--font-cairo)', 'sans-serif'],
        display: ['var(--font-playfair)', 'serif']
      },
      boxShadow: {
        soft: '0 15px 30px -15px rgba(194, 65, 12, 0.08)'
      }
    }
  },
  plugins: []
};

export default config;