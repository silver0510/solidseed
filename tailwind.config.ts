import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      xs: '375px', // iPhone SE (minimum requirement)
      sm: '640px', // Large phones
      md: '768px', // Tablets
      lg: '1024px', // Desktop
      xl: '1280px', // Large desktop
    },
    extend: {
      colors: {
        // Design system colors
        primary: {
          DEFAULT: '#2563EB',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        secondary: '#3B82F6',
        cta: '#F97316',
        background: '#F8FAFC',
        'text-primary': '#1E293B',
        'text-secondary': '#475569',
        'text-muted': '#64748B',
        border: '#E2E8F0',
      },
      fontFamily: {
        heading: ['var(--font-poppins)', 'sans-serif'],
        body: ['var(--font-open-sans)', 'sans-serif'],
      },
      minHeight: {
        touch: '44px', // Minimum touch target (Apple HIG)
      },
      minWidth: {
        touch: '44px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      transitionDuration: {
        '250': '250ms',
      },
    },
  },
  plugins: [],
};
export default config;
