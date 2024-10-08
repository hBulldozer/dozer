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
    extend: {},
  },
  plugins: [require('@tailwindcss/typography')],
}

module.exports = tailwindConfig
