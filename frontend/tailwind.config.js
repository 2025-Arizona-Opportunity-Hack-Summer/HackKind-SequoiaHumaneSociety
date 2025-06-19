/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          red: '#E63946',
          white: '#FAFAFA',
          charcoal: '#1E1E1E',
          blush: '#F9C0C0',
          'light-gray': '#DADADA',
          'medium-gray': '#888888',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Open Sans', ...defaultTheme.fontFamily.sans],
        heading: ['Poppins', ...defaultTheme.fontFamily.sans],
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.primary.charcoal'),
            a: {
              color: theme('colors.primary.red'),
              '&:hover': {
                color: theme('colors.primary.blush'),
              },
            },
            h1: {
              fontFamily: 'Poppins',
              color: theme('colors.primary.charcoal'),
            },
            h2: {
              fontFamily: 'Poppins',
              color: theme('colors.primary.charcoal'),
            },
            h3: {
              fontFamily: 'Poppins',
              color: theme('colors.primary.charcoal'),
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}