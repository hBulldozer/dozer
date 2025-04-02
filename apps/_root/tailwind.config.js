// @ts-check
/** @type {import('tailwindcss').Config} */
const tailwindConfig = {
  darkMode: 'media',
  presets: [require('@dozer/ui/tailwind')],
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    '../../packages/higmi/{components,systems}/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/{,!(node_modules)/**/}*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 15s linear infinite',
        pulse: 'pulse 3s ease-in-out infinite',
        'meteor-effect': 'meteor 7s linear infinite',
      },
      keyframes: {
        meteor: {
          '0%': { transform: 'rotate(215deg) translateX(0)', opacity: '0' },
          '5%': { opacity: '1' },
          '100%': {
            transform: 'rotate(215deg) translateX(-2000px)',
            opacity: '0',
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

module.exports = tailwindConfig
