/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        premium: {
          gold: '#D4AF37',
          'gold-hover': '#C5A028',
          dark: '#0A0F1C',
          card: '#111827',
          accent: '#1E293B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        meteor: {
          "0%": { transform: "rotate(215deg) translateX(0)", opacity: "1" },
          "70%": { opacity: "1" },
          "100%": {
            transform: "rotate(215deg) translateX(-500px)",
            opacity: "0",
          },
        },
        'beam-vertical': {
          '0%': { top: '-100%', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { top: '100%', opacity: '0' },
        },
        'beam-horizontal': {
          '0%': { left: '-100%', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { left: '100%', opacity: '0' },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        moveRight: {
          '0%': { left: '0%', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { left: '100%', opacity: '0' },
        },
        moveLeft: {
          '0%': { right: '0%', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { right: '100%', opacity: '0' },
        }
      },
      animation: {
        meteor: "meteor 5s linear infinite",
        'beam-vertical': 'beam-vertical 4s infinite linear',
        'beam-horizontal': 'beam-horizontal 5s infinite linear',
        'gradient-x': 'gradient-x 3s ease infinite',
        shimmer: 'shimmer 2s infinite linear',
        moveRight: 'moveRight 3s infinite linear',
        moveLeft: 'moveLeft 3s infinite linear',
      }
    },
  },
  plugins: [],
}
