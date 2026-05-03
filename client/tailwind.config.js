/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif']
      },
      colors: {
        base: { DEFAULT: '#0f1117', 800: '#1a1d27', 700: '#22263a', 600: '#2d3250' },
        accent: { DEFAULT: '#6366f1', dark: '#4f46e5', light: '#818cf8' }
      }
    }
  },
  plugins: []
};