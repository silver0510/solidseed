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
      // Touch Target & Interactive Element Heights
      minHeight: {
        'touch': '44px',          // Minimum touch target (iOS HIG)
        'interactive': '44px',    // Standard interactive element
        'button': '44px',         // Button minimum
        'button-lg': '52px',      // Large button (social login)
        'input': '44px',          // Form input minimum
        'textarea': '60px',       // Textarea minimum
        'nav-item': '56px',       // Bottom navigation item
        'card-min': '100px',      // Minimum card content area
        'loading': '400px',       // Loading state container
      },
      height: {
        'touch': '44px',
        'interactive': '44px',
        'button': '44px',
        'button-lg': '52px',
        'input': '44px',
        'textarea': '60px',
        'nav-item': '56px',
        'separator': '1px',       // Horizontal separator
        'drawer-handle': '0.5rem', // Drawer drag handle
      },
      // Touch Target & Interactive Element Widths
      minWidth: {
        'touch': '44px',
        'interactive': '44px',
        'button': '100px',        // Minimum button width
        'nav-item': '64px',       // Bottom navigation item
        'column': '280px',        // Kanban/Pipeline column (mobile)
        'column-md': '320px',     // Kanban/Pipeline column (desktop)
        'select-sm': '120px',     // Small select dropdown
        'select': '150px',        // Standard select dropdown
        'select-lg': '200px',     // Large select dropdown
      },
      width: {
        'separator': '1px',       // Vertical separator
        'drawer-handle': '100px', // Drawer drag handle
        'container-max': '1000px', // Maximum content container
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
