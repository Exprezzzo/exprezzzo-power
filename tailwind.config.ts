import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        brand: ["var(--font-thnocentric)", "Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      colors: {
        primary: "#FFD700",
        bgDark: "#0D0F12",
        surfaceDark: "#15181D",
        textDark: "#E6EAF0",
        bgLight: "#F2F3F5",
        surfaceLight: "#E6E8EC",
        textLight: "#111316",
        glass: "rgba(255,255,255,0.05)"
      }
    }
  },
  plugins: []
};

export default config;