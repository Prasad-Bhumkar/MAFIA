module.exports = {
  content: [
    "./src/**/*.{ts,tsx,js,jsx}",
    "./src/views/**/*.{ts,tsx,js,jsx}",
    "./templates/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          dark: '#1e40af'
        },
        secondary: {
          DEFAULT: '#4b5563',
          dark: '#1f2937'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}