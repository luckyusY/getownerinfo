/** @type {import('tailwindcss').Config} */
module.exports = {
  // A touch device applies :hover on tap and holds it until you tap somewhere
  // else, so hover styling used to stick to whatever was last pressed.
  future: { hoverOnlyWhenSupported: true },
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
          DEFAULT: "#1668E3", // primary action blue
          dark: "#0F52BC",
          light: "#8FBAF5",
          50: "#EAF2FD",
          100: "#D5E5FB",
        },
        // The cyan from the logo swoosh — accents and highlights, not actions.
        sky: {
          DEFAULT: "#15B0DD",
          dark: "#1187B0",
          light: "#9FDCEF",
          50: "#E7F7FC",
        },
        // Deep navy used by the footer and dark panels in the mockups.
        navy: { DEFAULT: "#0C2340", soft: "#15335C", line: "#24456F" },
        clay: "#FAA603",
        // Amber accent. The 50/700 pair is the badge tint used for Model B and
        // for-sale tags — warmer than Tailwind's amber, which "warning" uses.
        gold: { DEFAULT: "#FAA603", 50: "#F7ECCF", 700: "#7A5A17" },
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
