/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'green-deep': '#1B4332',
        'green-mid': '#2D6A4F',
        amber: '#E8A838',
        coral: '#E85D5D',
        bg: '#152e22',
      },
    },
  },
  plugins: [],
};

