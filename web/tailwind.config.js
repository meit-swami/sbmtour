/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#0c1929",
          "navy-light": "#152a45",
          accent: "#FF9F1C",
          "accent-hover": "#e68f10",
        },
        admin: {
          sidebar: "#111827",
          accent: "#e91e63",
          "accent-hover": "#d81b60",
        },
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Ubuntu",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
