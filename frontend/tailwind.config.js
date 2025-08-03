/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
      extend: {
        fontFamily: {
          sans: ['DM Sans', 'sans-serif'],
          baskervville: ['Baskervville', 'serif'],
        },
      },
    },
    plugins: [require('@tailwindcss/line-clamp'),],
  }
  