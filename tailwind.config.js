/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        navy: {
          900: '#0a1930', 
          800: '#112240', 
        },
        primary: '#0a1930', 
        accent: {
          DEFAULT: '#00e5ff',
          hover: '#00c2ff',
        },
        success: '#10b981', 
        warning: '#f59e0b', 
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
