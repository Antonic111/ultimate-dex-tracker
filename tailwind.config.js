/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pokemon-blue': '#3B82F6',
        'pokemon-red': '#EF4444',
        'pokemon-yellow': '#F59E0B',
        'pokemon-green': '#10B981',
      },
      fontFamily: {
        'pokemon': ['Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
