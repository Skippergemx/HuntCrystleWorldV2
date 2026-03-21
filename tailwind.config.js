/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '360px',
      },
      keyframes: {
        'shake-lite': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px)' },
          '75%': { transform: 'translateX(2px)' }
        },
        'strike-left': {
          '0%, 100%': { transform: 'translateX(0) scale(1)' },
          '50%': { transform: 'translateX(-20px) scale(1.05)' }
        },
        'strike-right': {
          '0%, 100%': { transform: 'translateX(0) scale(1)' },
          '50%': { transform: 'translateX(20px) scale(1.05)' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' }
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(6, 182, 212, 0.4)' },
          '50%': { boxShadow: '0 0 15px rgba(6, 182, 212, 0.8)' }
        }
      },
      animation: {
        'shake-lite': 'shake-lite 0.2s cubic-bezier(.36,.07,.19,.97) both',
        'strike-left': 'strike-left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
        'strike-right': 'strike-right 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }
    },
  },
  plugins: [],
}
