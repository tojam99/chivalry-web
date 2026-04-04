/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#F0F5ED',
          100: '#D4E5CC',
          200: '#B8D4AB',
          300: '#9AC389',
          400: '#7A9A6D',
          500: '#6B8B5E',
          600: '#4A5844',
          700: '#3A4636',
          800: '#2C3028',
          900: '#1E2420',
        },
        cream: {
          50: '#FDFCFA',
          100: '#FAF8F4',
          200: '#F7F4EF',
          300: '#EDE8DF',
          400: '#E0DBD2',
          500: '#D8D3C8',
          600: '#B5B0A5',
          700: '#8A8578',
          800: '#5E5A50',
          900: '#2C2A24',
        },
        gold: {
          400: '#C8A96E',
          500: '#C4A882',
          600: '#A08552',
        },
      },
      fontFamily: {
        display: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        body: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
