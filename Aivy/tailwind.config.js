// tailwind.config.js
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: "var(--color-accent)",
        grayish: "var(--color-gray)",
        bg: "var(--color-bg)",
        panel: "var(--color-panel)",
        text: "var(--color-text)",
        border: "var(--color-border)",
      },
      boxShadow: {
        soft: "0 2px 6px rgba(0, 0, 0, 0.15)",
        deep: "0 8px 24px rgba(0, 0, 0, 0.25)",
        inset: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};