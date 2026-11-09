import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "#070510", 900: "#0d0a1c", 800: "#151030", 700: "#1f1847" },
        saga: { 400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed" },
        ember: { 400: "#fbbf24", 500: "#f59e0b" },
      },
      fontFamily: {
        display: ["ui-serif", "Iowan Old Style", "Palatino Linotype", "Georgia", "serif"],
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "sans-serif"],
      },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0) rotateX(0)" }, "50%": { transform: "translateY(-14px) rotateX(4deg)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        rise: { from: { opacity: "0", transform: "translateY(24px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        rise: "rise .6s cubic-bezier(.2,.7,.2,1) both",
      },
    },
  },
  plugins: [],
};
export default config;
