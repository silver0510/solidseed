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
      // Design Tokens - Sizing
      // Using semantic names that map to actual use cases
      minHeight: {
        'touch': '44px',          // Base touch target (iOS HIG) - use for buttons, inputs, interactive elements
        'touch-lg': '52px',       // Large touch target (social login buttons)
        'textarea': '60px',       // Textarea minimum
        'nav-item': '56px',       // Bottom navigation item
        'card-min': '100px',      // Minimum card/textarea content area
        'loading': '400px',       // Loading state container
      },
      height: {
        'touch': '44px',
        'touch-lg': '52px',
        'nav-item': '56px',
        'separator': '1px',
        'drawer-handle': '0.5rem',
      },
      minWidth: {
        'touch': '44px',          // Base touch target
        'button': '100px',        // Minimum button width
        'nav-item': '64px',       // Bottom navigation item
        'column': '280px',        // Kanban/Pipeline column (mobile)
        'column-md': '320px',     // Kanban/Pipeline column (desktop)
        'select-sm': '120px',     // Small select dropdown
        'select': '150px',        // Standard select dropdown
        'select-lg': '200px',     // Large select dropdown
      },
      width: {
        'separator': '1px',
        'drawer-handle': '100px',
        'select': '150px',        // Fixed width select
        'select-lg': '200px',     // Fixed width large select
      },
      maxWidth: {
        'container': '1000px',    // Maximum content width
        'tag': '80px',            // Tag label max width
      },
      maxHeight: {
        'dropdown': '300px',      // Dropdown menu max height
        'card-expanded': '2000px', // Expanded card animation
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
