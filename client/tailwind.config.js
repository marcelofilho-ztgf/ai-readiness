/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0f",
        panel: "#14141c",
        panel2: "#1c1c28",
        borderc: "#2a2a3a",
        textc: "#f0f0f5",
        muted: "#8a8aa0",
        accent: "#6c5ce7",
        accent2: "#00d8a0",
        alta: "#ff5470",
        media: "#ffb340",
        baixa: "#6a7a90",
      },
      keyframes: {
        fade: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "none" },
        },
      },
      animation: {
        fade: "fade .35s ease",
      },
    },
  },
  plugins: [],
};
