/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'massa-preto': '#0b0b0b',     
        'massa-cinza': '#141414',     
        'massa-dourado': '#ffc107',   
        'massa-vermelho': '#dc3545',  
      }
    },
  },
  plugins: [],
}