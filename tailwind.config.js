/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',   // Il tuo Indaco
        secondary: '#10B981', // Il tuo Verde
        accent: '#F59E0B',    // Il tuo Arancione
      },
    },
  },
  plugins: [],
}