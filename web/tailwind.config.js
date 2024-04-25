/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        focus: "0 0 0 .25rem rgba(13, 110, 253, .25)"
      }
    },
  },
  plugins: [],
}