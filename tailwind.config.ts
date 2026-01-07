import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
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
      minHeight: {
        touch: '44px', // Minimum touch target (Apple HIG)
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};
export default config;
