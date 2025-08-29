import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FFD700",
        bgDark: "#0D0F12",
        surfaceDark: "#15181D",
        textDark: "#E6EAF0",
        bgLight: "#F2F3F5",
        surfaceLight: "#E6E8EC",
        textLight: "#111316",
        glass: "rgba(255,255,255,0.05)"
      },
      animation: {
        fadeIn: "fadeIn 150ms ease-out",
        slideUp: "slideUp 200ms ease-out"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        }
      }
    }
  },
  plugins: []
};

export default config;