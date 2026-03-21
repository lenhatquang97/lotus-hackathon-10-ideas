/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        DEFAULT: '2px',
        sm: '2px', md: '2px', lg: '2px', xl: '2px',
      },
      colors: {
        ink: '#0A0A0A',
        ash: '#6B6B6B',
        fog: '#E8E8E8',
        paper: '#F7F6F4',
        surface: '#FFFFFF',
      }
    },
  },
  plugins: [],
}
