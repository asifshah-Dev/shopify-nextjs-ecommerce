/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        cream: {
          50: '#fefcf5',
          100: '#fdf6e3',
          200: '#f9edc7',
          300: '#f5e4ab',
          400: '#f1db8f',
          500: '#edd273',
          600: '#e5c947',
          700: '#d4b820',
          800: '#b39b1b',
          900: '#8a7815',
        },
        coral: {
          50: '#fef6f3',
          100: '#fde8e3',
          200: '#fccfc7',
          300: '#fbb6ab',
          400: '#fa9d8f',
          500: '#f98473',
          600: '#f56b57',
          700: '#e8523b',
          800: '#d1391f',
          900: '#ba2003',
        },
      },
    },
  },
  plugins: [],
};