/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'industrial': {
          900: '#0a0c10',
          800: '#12151c',
          700: '#1a1e28',
          600: '#242a36',
          500: '#2e3644',
          400: '#3d4758',
          300: '#5a6882',
          200: '#8896ad',
          100: '#b4c0d3',
        },
        'warning-red': '#ef4444',
        'safe-green': '#22c55e',
        'accent-amber': '#f59e0b',
        'accent-cyan': '#06b6d4',
        'accent-violet': '#8b5cf6',
      },
      animation: {
        'zone-pulse': 'zonePulse 0.6s ease-in-out 5',
        'alert-slide': 'alertSlide 0.4s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        zonePulse: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(6, 182, 212, 0)' },
          '50%': { transform: 'scale(1.03)', boxShadow: '0 0 20px 4px rgba(6, 182, 212, 0.6)' },
        },
        alertSlide: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(6, 182, 212, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)' },
        },
      },
    },
  },
  plugins: [],
}
