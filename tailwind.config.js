/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/components/Purr/**/*.{js,ts,jsx,tsx}',
    './src/components/App/Purr.tsx',
    './src/components/KittyFamily/**/*.{js,ts,jsx,tsx}',
    './src/components/App/KittyFamily.tsx',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['bungee', 'sans-serif'],
        script: ['funkydori', 'sans-serif'],
        mono: ['source-code-pro', 'monospace'],
      },
      colors: {
        purr: {
          pink: '#ec23a5',
          dark: '#0a0a0a',
          cream: '#f6f6f6',
        },
        kf: {
          coral: '#ff9b6a',
          pink: '#e96bd4',
          cream: '#f9f8f6',
          sand: '#f3f1ee',
          warm: '#82817d',
          ink: '#2a2825',
        },
      },
      backgroundImage: {
        'purr-pattern': "url('https://cdn.halfasecond.com/images/purr/bg.svg')",
      },
    },
  },
  plugins: [],
}