/** @type {import('tailwindcss').Config} */
const rgb = (v) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        background: rgb("--background"),
        foreground: rgb("--foreground"),
        card: {
          DEFAULT: rgb("--card"),
          foreground: rgb("--card-foreground"),
        },
        popover: {
          DEFAULT: rgb("--popover"),
          foreground: rgb("--popover-foreground"),
        },
        primary: {
          DEFAULT: rgb("--primary"),
          foreground: rgb("--primary-foreground"),
        },
        secondary: {
          DEFAULT: rgb("--secondary"),
          foreground: rgb("--secondary-foreground"),
        },
        muted: {
          DEFAULT: rgb("--muted"),
          foreground: rgb("--muted-foreground"),
        },
        accent: {
          DEFAULT: rgb("--accent"),
          foreground: rgb("--accent-foreground"),
        },
        destructive: {
          DEFAULT: rgb("--destructive"),
          foreground: rgb("--destructive-foreground"),
        },
        border: rgb("--border"),
        input: rgb("--input"),
        ring: rgb("--ring"),

        ocean: {
          DEFAULT: rgb("--ocean"),
          foreground: rgb("--ocean-foreground"),
        },
        forest: {
          DEFAULT: rgb("--forest"),
          foreground: rgb("--forest-foreground"),
        },
        sand: {
          DEFAULT: rgb("--sand"),
          foreground: rgb("--sand-foreground"),
        },
        cta: {
          DEFAULT: rgb("--cta"),
          foreground: rgb("--cta-foreground"),
        },
        gold: rgb("--gold"),

        /* Legacy brand tokens (kept for backwards compat in admin & old pages) */
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
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Ubuntu",
          "sans-serif",
        ],
        display: [
          "Plus Jakarta Sans",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 12px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};
