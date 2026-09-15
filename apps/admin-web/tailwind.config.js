/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F7F5F0',
        ink: '#1C1F1E',
        teal: {
          50: '#EAF3F2',
          100: '#CFE4E2',
          400: '#1C6E6A',
          600: '#134B48',
          800: '#0F3D3E',
          900: '#0A2B2C',
        },
        amber: { 400: '#E8A33D', 500: '#D9922A', 600: '#B87621' },
        border: '#E4E0D6',
      },
      fontFamily: {
        display: ['"Lexend"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
