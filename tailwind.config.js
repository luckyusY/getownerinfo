/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette mirrors getownerinfo.com
        paper: "#F7F8FA",
        surface: "#FFFFFF",
        panel: "#EEF2F5",
        ink: { DEFAULT: "#071C1F", soft: "#5C727D", faint: "#93A1A8" },
        line: "#E4E9ED",
        brand: {
          DEFAULT: "#15B0DD", // sky blue
          dark: "#1187B0",
          light: "#9FDCEF",
          50: "#E7F7FC",
        },
        clay: "#FAA603",
        gold: "#FAA603", // amber accent
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
