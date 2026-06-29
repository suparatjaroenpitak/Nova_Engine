/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nova: {
          bg: '#1a1a2e',
          surface: '#16213e',
          surface2: '#0f3460',
          accent: '#e94560',
          text: '#e0e0e0',
          muted: '#8892b0',
          border: '#2a2a4a',
          active: '#1a5276',
          hover: '#1f3a5f',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
