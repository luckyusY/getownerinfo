/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FAF7F1",
        surface: "#FFFFFF",
        panel: "#F3EEE4",
        ink: { DEFAULT: "#15211C", soft: "#4B5A53", faint: "#8A958F" },
        line: "#E7E0D2",
        brand: {
          DEFAULT: "#0C5A4E", // pine teal
          dark: "#093F37",
          light: "#7FBFB3",
          50: "#EAF4F1",
        },
        clay: "#C2693F",
        gold: "#D2A04A",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(21,33,28,0.04), 0 8px 24px -12px rgba(21,33,28,0.12)",
        lift: "0 2px 4px rgba(21,33,28,0.05), 0 18px 40px -16px rgba(21,33,28,0.22)",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};
