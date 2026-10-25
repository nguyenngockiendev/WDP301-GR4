/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          light: '#34d399',
          DEFAULT: '#059669',
          dark: '#047857',
          900: '#064e3b',
        },
        accent: {
          light: '#2dd4bf',
          DEFAULT: '#0d9488',
          dark: '#115e59',
        },
        status: {
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          info: '#0ea5e9',
        },

        surface: {
          bg: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
          dark: '#0f172a',
        },

        content: {
          main: '#0f172a',
          sub: '#475569',
          muted: '#94a3b8',
        },
      },

      backgroundImage: {
        'gradient-emerald': 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',

        'gradient-mint': 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',

        'gradient-sidebar': 'linear-gradient(180deg, #064e3b 0%, #022c22 100%)',
      },

      borderRadius: {
        modern: '14px',
      },

      boxShadow: {
        soft: '0 4px 20px -2px rgba(5, 150, 105, 0.08)',
        card: '0 2px 10px 0 rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
