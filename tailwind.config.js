/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ku: {
          50: '#F5F0FF',
          100: '#EBDDFF',
          300: '#C4A1FF',
          500: '#8B3DFF',
          600: '#7A2FE0',
          700: '#6425B8',
          900: '#2E1065',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        sora: ['Sora', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 14px 45px rgba(46, 16, 101, 0.10)',
      },
    },
  },
  plugins: [],
}
