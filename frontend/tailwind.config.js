/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: '#0e0e0c',
        paper: '#f4f1ea',
        paper2: '#ebe6db',
        rule: '#22221f',
        muted: '#6b685f',
        accent: '#b8412c', // legal red-clay
        accent2: '#1f3d2b', // deep forest
        gold: '#a8854b',
        warn: '#c5681e',
        ok: '#3a6b3f',
        danger: '#9a2a1f',
        // Mapping old colors to new ones to prevent total breakage immediately
        background: '#f4f1ea',
        surface: '#ebe6db',
        text: '#0e0e0c',
      },
    },
  },
  plugins: [],
}
