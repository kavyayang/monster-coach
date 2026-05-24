/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'SF Mono', 'monospace'],
        sans: ['"Inter"', '"SF Pro Display"', 'system-ui', 'sans-serif'],
      },
      colors: {
        cyber: {
          cyan: '#00E5FF',
          'cyan-dim': 'rgba(0, 229, 255, 0.15)',
          'cyan-glow': 'rgba(0, 229, 255, 0.3)',
          dark: '#0B1120',
          darker: '#060B15',
          card: 'rgba(15, 23, 42, 0.75)',
          alert: '#991B1B',
          'alert-bg': 'rgba(153, 27, 27, 0.3)',
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'heartbeat': 'heartbeat 1.2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(0, 229, 255, 0.7)' },
          '50%': { opacity: '0.5', boxShadow: '0 0 0 6px rgba(0, 229, 255, 0)' },
        },
        'heartbeat': {
          '0%, 100%': { transform: 'scale(1)' },
          '15%': { transform: 'scale(1.15)' },
          '30%': { transform: 'scale(1)' },
          '45%': { transform: 'scale(1.1)' },
          '60%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
