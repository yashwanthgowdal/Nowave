import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        obsidian: "#0F0F11",
        "obsidian-card": "#18181B",
        "obsidian-border": "#27272A",
        "obsidian-muted": "#3F3F46",
        parchment: "#FAF7F2",
        ivory: "#F5F0E8",
        espresso: "#1C1917",
        brass: "#D97706",
        "brass-light": "#F59E0B",
        "brass-dark": "#B45309",
        charcoal: "#0F0F11",
        "charcoal-card": "#18181B",
        "charcoal-light": "#27272A",
        amber: "#F59E0B",
        "veg-green": "#10B981",
        "nonveg-brown": "#EF4444",
        "soldout-red": "#EF4444",
        emerald: {
          500: "#10B981",
          600: "#059669",
        },
      },
      fontFamily: {
        serif: ["Playfair Display", "Cormorant Garamond", "Georgia", "serif"],
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "paper-texture":
          "url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-in-right": "slideInRight 0.4s ease-out",
        "stamp": "stamp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        stamp: {
          "0%": { opacity: "0", transform: "scale(1.5) rotate(-12deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(-6deg)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
