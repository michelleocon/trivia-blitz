/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'pop-in': {
          '0%':   { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-border': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(234,179,8,0.7)' },
          '50%':       { boxShadow: '0 0 0 8px rgba(234,179,8,0)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%':       { transform: 'rotate(3deg)' },
        },
      },
      animation: {
        'pop-in':       'pop-in 0.3s ease-out both',
        'slide-up':     'slide-up 0.4s ease-out both',
        'pulse-border': 'pulse-border 1s ease-in-out infinite',
        wiggle:         'wiggle 0.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
