/** @type {import('tailwindcss').Config} */
// Every shade used in the app is defined here, so Tailwind's default teal/amber/red
// (different hues) can never slip in.
//   teal   = brand, primary actions, "normal / active"
//   amber  = money owed, current session, anything that needs attention
//   danger = destructive or irreversible actions, errors
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F7F5F0',
        ink: '#1C1F1E',
        border: '#E4E0D6',
        teal: {
          50: '#EAF3F2',
          100: '#CFE4E2',
          200: '#A6CBC7',
          300: '#6FA7A2',
          400: '#1C6E6A',
          500: '#185D5A',
          600: '#134B48',
          700: '#114442',
          800: '#0F3D3E',
          900: '#0A2B2C',
        },
        amber: {
          50: '#FBF4E8',
          100: '#F5E2C1',
          400: '#E8A33D',
          500: '#D9922A',
          600: '#B87621',
          700: '#8C5A19',
        },
        danger: {
          50: '#FAEEEB',
          100: '#F2D5CF',
          500: '#C2503E',
          600: '#A8412F',
          700: '#863324',
        },
      },
      fontFamily: {
        display: ['"Lexend"', '"Hind Siliguri"', 'sans-serif'],
        body: ['"Inter"', '"Hind Siliguri"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
