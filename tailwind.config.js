/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0B0D12",
        surface: "#12151C",
        raised: "#1A1F29",
        hairline: "rgba(255,255,255,0.10)",
        aivora: {
          cyan: "#22D3EE",
          blue: "#5E9FE8",
          violet: "#A78BFA",
          amber: "#DE9255",
          danger: "#E97366",
          good: "#72BC8F",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Inter",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["Menlo", "Consolas", "ui-monospace", "monospace"],
      },
      borderRadius: { xl: "12px" },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,.25), 0 4px 16px rgba(0,0,0,.28)",
        glow: "0 0 32px rgba(34,211,238,0.22)",
      },
      keyframes: {
        breathe: {
          "0%,100%": { opacity: "0.55", transform: "scale(0.96)" },
          "50%": { opacity: "1", transform: "scale(1.04)" },
        },
        bar: {
          "0%,100%": { transform: "scaleY(0.35)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        breathe: "breathe 2.4s ease-in-out infinite",
        bar: "bar 900ms ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
