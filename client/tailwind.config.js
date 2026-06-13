/** @type {import('tailwindcss').Config} */
import scrollbar from 'tailwind-scrollbar';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enables dark mode toggling using a class on the html element
  theme: {
    extend: {
      colors: {
        instagram: {
          blue: '#0095f6',
          darkBlue: '#0074cc',
          red: '#ff3040',
          darkRed: '#e10c22',
          gradientStart: '#feda75',
          gradientMiddle: '#d62976',
          gradientEnd: '#962fbf',
        },
        premium: {
          darkBg: '#090a0f',
          darkCard: '#131520',
          darkBorder: '#222638',
          lightBg: '#fafafa',
          lightCard: '#ffffff',
          lightBorder: '#dbdbdb',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'like-scale': 'likeScale 0.45s ease-in-out forwards',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        likeScale: {
          '0%': { transform: 'scale(0) rotate(-15deg)', opacity: '0' },
          '50%': { transform: 'scale(1.3) rotate(5deg)', opacity: '0.9' },
          '70%': { transform: 'scale(0.9) rotate(-3deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(15px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [
    scrollbar({ nocompatible: true }),
  ],
};
