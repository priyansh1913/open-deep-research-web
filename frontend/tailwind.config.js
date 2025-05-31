/** @type {import('tailwindcss').Config} */
module.exports = { 
  content: ["./src/**/*.{js,jsx,ts,tsx}"], 
  theme: { 
    extend: {
      colors: {
        indigo: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.700'),
            h1: {
              color: theme('colors.indigo.800'),
            },
            h2: {
              color: theme('colors.indigo.700'),
            },
            h3: {
              color: theme('colors.indigo.600'),
            },
            a: {
              color: theme('colors.indigo.500'),
              '&:hover': {
                color: theme('colors.indigo.600'),
              },
            },
            strong: {
              color: theme('colors.gray.800'),
            },
          },
        },
      }),
    },
  }, 
  plugins: [
    require('@tailwindcss/typography'),
  ] 
}
