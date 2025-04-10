/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: 'class', // 👈 IMPORTANT
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
