/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        vault: {
          purple: '#7B61FF',
          'purple-light': '#9580FF',
          'purple-dark': '#5A45CC',
        },
        sidebar: {
          bg: '#1A1D21',
          hover: '#2A2D31',
          active: '#3A3D41',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
      },
      spacing: {
        sidebar: '260px',
        header: '56px',
      },
    },
  },
  plugins: [],
};
