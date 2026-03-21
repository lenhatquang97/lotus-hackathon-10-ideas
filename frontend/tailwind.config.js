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
        bg: '#0D0B14',
        surface: '#13111E',
        'surface-2': '#1A1728',
        'surface-3': '#221F30',
        accent: '#B8A0FF',
        'text-primary': 'rgba(255, 255, 255, 0.90)',
        'text-secondary': 'rgba(255, 255, 255, 0.45)',
        'text-muted': 'rgba(255, 255, 255, 0.22)',
      }
    },
  },
  plugins: [],
}
