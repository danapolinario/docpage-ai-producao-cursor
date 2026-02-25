/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./server/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        startup: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6',
          600: '#0d9488',
          900: '#134e4a',
        },
        clinical: {
          50: '#f8fafc',
          100: '#f1f5f9',
          500: '#64748b',
          900: '#0f172a',
        },
      },
      boxShadow: {
        'soft': '0 20px 40px -15px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 20px rgba(20, 184, 166, 0.3)',
      },
      animation: {
        'scroll-x': 'scrollX 40s linear infinite',
      },
    },
  },
  plugins: [],
};
