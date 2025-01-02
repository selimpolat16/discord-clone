/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          'primary': '#36393f',
          'secondary': '#2f3136',
          'tertiary': '#202225',
          'text': '#dcddde',
          'muted': '#8e9297',
          'accent': '#7289da',
          'hover': '#393c43',
        },
      },
    },
  },
  plugins: [],
} 