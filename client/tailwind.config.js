/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // All themed colors read from CSS variables so light/dark switching works.
        // The <alpha-value> token lets Tailwind opacity modifiers work (e.g. bg-background/95).
        background: 'rgb(var(--bg) / <alpha-value>)',
        surface:    'rgb(var(--surface) / <alpha-value>)',
        card:       'rgb(var(--card) / <alpha-value>)',
        border:     'rgb(var(--border) / <alpha-value>)',
        textPrimary:   'rgb(var(--text-primary) / <alpha-value>)',
        textSecondary: 'rgb(var(--text-secondary) / <alpha-value>)',
        textMuted:     'rgb(var(--text-muted) / <alpha-value>)',
        accent: {
          DEFAULT: '#c9a84c',
          light: '#e8c870',
          dark: '#a8893c',
        },
        success: '#22c55e',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        card: '12px',
      },
      boxShadow: {
        cardHover: '0 20px 60px rgba(0,0,0,0.5)',
        modal: '0 25px 80px rgba(0,0,0,0.7)',
      },
      transitionTimingFunction: {
        luxe: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'pop': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.4)' },
          '100%': { transform: 'scale(1)' },
        },
        'shimmer': {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s cubic-bezier(0.4,0,0.2,1)',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.4,0,0.2,1)',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.4,0,0.2,1)',
        'pop': 'pop 0.35s cubic-bezier(0.4,0,0.2,1)',
      },
    },
  },
  plugins: [],
};
